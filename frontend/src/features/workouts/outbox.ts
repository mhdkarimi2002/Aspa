import { z } from "zod";
import { ApiError } from "../../api/client";
import { runSchema, type Plan, type WorkoutRun } from "../contracts";
import {
  documentSchema,
  fromRun,
  newDocument,
  repeatDocument,
  syncBody,
  syncBodySchema,
  type WorkoutDocument,
  type SyncBody,
} from "./model";
const pendingSchema = z.object({
  body: syncBodySchema,
  revision: z.number(),
});
export const entrySchema = z.object({
  document: documentSchema,
  server_id: z.string().nullable(),
  version: z.number().int().nonnegative(),
  revision: z.number().int(),
  dirty: z.boolean(),
  pending: pendingSchema.nullable(),
  problem: z.enum(["network", "conflict", "invalid", "auth"]).nullable(),
  remote: runSchema.nullable(),
  rest_until: z.number().nullable(),
});
export type Entry = z.infer<typeof entrySchema>;
export type Snapshot = {
  loaded: boolean;
  entries: Entry[];
  storageError: boolean;
  syncing: boolean;
};
export interface OutboxStorage {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
}
export interface OutboxTransport {
  sync(body: SyncBody): Promise<WorkoutRun>;
  active(): Promise<WorkoutRun | null>;
  detail(id: string): Promise<WorkoutRun>;
}
// An immutable, persisted pending payload is reused after uncertain HTTP outcomes.
// A newer edit is queued separately and uses the acknowledged version afterwards.
export class WorkoutOutbox {
  private snapshot: Snapshot = {
    loaded: false,
    entries: [],
    storageError: false,
    syncing: false,
  };
  private listeners = new Set<() => void>();
  private writes: Promise<void> = Promise.resolve();
  private flight: Promise<void> | null = null;
  private stopped = false;
  constructor(
    private storage: OutboxStorage,
    private transport: OutboxTransport,
    private allowed: () => boolean = () => true,
  ) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit(next: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...next };
    this.listeners.forEach((fn) => fn());
  }
  private persist(entries: Entry[]) {
    const value = JSON.stringify(entries);
    const task = this.writes.then(() => this.storage.write(value));
    this.writes = task.catch(() => {});
    return task;
  }
  private async save(entries: Entry[]) {
    try {
      await this.persist(entries);
      this.emit({ entries, storageError: false });
    } catch (error) {
      this.emit({ storageError: true });
      throw error;
    }
  }
  // Serialize local edits with acknowledgements: neither can overwrite the other's snapshot.
  private operations: Promise<void> = Promise.resolve();
  private transaction<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.operations.then(fn, fn);
    this.operations = result.then(
      () => {},
      () => {},
    );
    return result;
  }
  async load() {
    try {
      const raw = await this.storage.read();
      const entries = raw ? z.array(entrySchema).parse(JSON.parse(raw)) : [];
      this.emit({ loaded: true, entries });
    } catch {
      this.emit({ loaded: true, storageError: true });
    }
  }
  start() {
    this.stopped = false;
  }
  stop() {
    this.stopped = true;
  }
  async create(plan?: Plan, run?: WorkoutRun) {
    return this.transaction(async () => {
      if (!this.snapshot.loaded || this.snapshot.storageError)
        throw new Error("Storage unavailable");
      if (
        this.snapshot.entries.some((e) => e.document.status === "in_progress")
      )
        throw new Error("Active workout exists");
      if (plan && (plan.is_archived || !plan.exercises.length))
        throw new Error("Plan is not startable");
      const document = run ? repeatDocument(run) : newDocument(plan);
      const entry: Entry = {
        document,
        server_id: null,
        version: 0,
        revision: 1,
        dirty: true,
        pending: null,
        problem: null,
        remote: null,
        rest_until: null,
      };
      await this.save([...this.snapshot.entries, entry]);
      return document.client_id;
    });
  }
  async change(
    client: string,
    update: (document: WorkoutDocument) => WorkoutDocument,
    restUntil?: number | null,
  ) {
    await this.transaction(async () => {
      const entry = this.snapshot.entries.find(
        (e) => e.document.client_id === client,
      );
      if (!entry || entry.document.status !== "in_progress")
        throw new Error("Workout is not editable");
      const document = documentSchema.parse(
        update(JSON.parse(JSON.stringify(entry.document))),
      );
      const next = {
        ...entry,
        document,
        revision: entry.revision + 1,
        dirty: true,
        pending: entry.problem === "invalid" ? null : entry.pending,
        problem: entry.problem === "conflict" ? ("conflict" as const) : null,
        rest_until: restUntil === undefined ? entry.rest_until : restUntil,
      };
      await this.save(
        this.snapshot.entries.map((e) => (e === entry ? next : e)),
      );
    });
  }
  async rest(client: string, until: number | null) {
    await this.transaction(async () => {
      await this.save(
        this.snapshot.entries.map((e) =>
          e.document.client_id === client ? { ...e, rest_until: until } : e,
        ),
      );
    });
  }
  async adopt(run: WorkoutRun) {
    if (!run.client_id) return;
    await this.transaction(async () => {
      const existing = this.snapshot.entries.find(
        (e) => e.document.client_id === run.client_id,
      );
      if (
        existing &&
        (existing.dirty || existing.pending || existing.version >= run.version)
      )
        return;
      const entry: Entry = {
        document: fromRun(run),
        server_id: run.id,
        version: run.version,
        revision: 0,
        dirty: false,
        pending: null,
        problem: null,
        remote: null,
        rest_until: null,
      };
      await this.save([
        ...this.snapshot.entries.filter(
          (e) => e.document.client_id !== run.client_id,
        ),
        entry,
      ]);
    });
  }
  async restoreActive() {
    if (!this.allowed() || this.stopped) return;
    try {
      const active = await this.transport.active();
      if (active && this.allowed() && !this.stopped) await this.adopt(active);
    } catch {
      /* Local documents remain usable without connectivity. */
    }
  }
  async resolve(client: string, choice: "remote" | "local") {
    await this.transaction(async () => {
      const entry = this.snapshot.entries.find(
        (e) => e.document.client_id === client,
      );
      if (!entry?.remote) throw new Error("No remote version");
      const remote = entry.remote;
      if (
        choice === "local" &&
        (remote.client_id !== client || remote.status !== "in_progress")
      )
        throw new Error("Cannot replace remote workout");
      const replacement: Entry =
        choice === "remote"
          ? {
              document: fromRun(remote),
              server_id: remote.id,
              version: remote.version,
              revision: 0,
              dirty: false,
              pending: null,
              problem: null,
              remote: null,
              rest_until: null,
            }
          : {
              ...entry,
              version: remote.version,
              server_id: remote.id,
              revision: entry.revision + 1,
              dirty: true,
              pending: null,
              problem: null,
              remote: null,
            };
      await this.save([
        ...this.snapshot.entries.filter(
          (e) =>
            e.document.client_id !== client &&
            e.document.client_id !== remote.client_id,
        ),
        replacement,
      ]);
    });
  }
  async retry(client: string) {
    await this.transaction(async () => {
      await this.save(
        this.snapshot.entries.map((e) =>
          e.document.client_id === client ? { ...e, problem: null } : e,
        ),
      );
    });
    await this.flush();
  }
  flush() {
    if (this.flight) return this.flight;
    const flight = this.drain();
    this.flight = flight;
    return flight.finally(() => {
      if (this.flight === flight) this.flight = null;
    });
  }
  private async drain() {
    if (
      !this.snapshot.loaded ||
      this.snapshot.storageError ||
      !this.allowed() ||
      this.stopped
    )
      return;
    this.emit({ syncing: true });
    try {
      while (this.allowed() && !this.stopped) {
        let entry = this.snapshot.entries.find(
          (e) =>
            (e.dirty || e.pending) &&
            e.problem !== "conflict" &&
            e.problem !== "invalid" &&
            e.problem !== "auth",
        );
        if (!entry) break;
        const client = entry.document.client_id;
        if (!entry.pending) {
          await this.transaction(async () => {
            const current = this.snapshot.entries.find(
              (e) => e.document.client_id === client,
            );
            if (!current) return;
            await this.save(
              this.snapshot.entries.map((e) =>
                e === current
                  ? {
                      ...current,
                      pending: {
                        body: syncBody(current.document, current.version),
                        revision: current.revision,
                      },
                    }
                  : e,
              ),
            );
          });
          entry = this.snapshot.entries.find(
            (e) => e.document.client_id === client,
          )!;
        }
        const pending = entry.pending!;
        try {
          const run = await this.transport.sync(pending.body);
          await this.transaction(async () => {
            const current = this.snapshot.entries.find(
              (e) => e.document.client_id === client,
            );
            if (!current) return;
            const newer = current.revision !== pending.revision;
            const unexpected = run.version > pending.body.expected_version + 1;
            const next: Entry = {
              ...current,
              server_id: run.id,
              version: run.version,
              document: newer || unexpected ? current.document : fromRun(run),
              dirty: newer || unexpected,
              pending: null,
              problem: unexpected ? "conflict" : null,
              remote: unexpected ? run : null,
            };
            await this.save(
              this.snapshot.entries.map((e) => (e === current ? next : e)),
            );
          });
        } catch (error) {
          const kind =
            error instanceof ApiError
              ? error.status === 409
                ? "conflict"
                : [401, 403].includes(error.status)
                  ? "auth"
                  : error.status >= 400 && error.status < 500
                    ? "invalid"
                    : "network"
              : "network";
          let remote: WorkoutRun | null = null;
          if (kind === "conflict") {
            try {
              remote = entry.server_id
                ? await this.transport.detail(entry.server_id)
                : await this.transport.active();
            } catch {}
          }
          await this.transaction(async () => {
            await this.save(
              this.snapshot.entries.map((e) =>
                e.document.client_id === client
                  ? { ...e, problem: kind, remote }
                  : e,
              ),
            );
          });
          break;
        }
      }
    } catch {
      this.emit({ storageError: true });
    } finally {
      this.emit({ syncing: false });
    }
  }
}
