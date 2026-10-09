import test from "node:test";
import assert from "node:assert/strict";
import {
  WorkoutOutbox,
  type OutboxTransport,
  type OutboxStorage,
} from "../src/features/workouts/outbox";
import {
  newDocument,
  repeatDocument,
  type SyncBody,
} from "../src/features/workouts/model";
import {
  type WorkoutRun,
  actualSetFormSchema,
  targetFormSchema,
  exercisePageSchema,
} from "../src/features/contracts";
import { ApiError } from "../src/api/client";
function memory() {
  let raw: string | null = null;
  return {
    read: async () => raw,
    write: async (value: string) => {
      raw = value;
    },
  } satisfies OutboxStorage;
}
function response(
  body: SyncBody,
  version = body.expected_version + 1,
): WorkoutRun {
  return {
    id: "10000000-0000-4000-8000-000000000001",
    client_id: body.client_id,
    plan_id: body.plan_id,
    plan_name: body.plan_name,
    started_at: body.started_at,
    completed_at: body.completed_at,
    status: body.status,
    duration_seconds: null,
    version,
    exercises: body.exercises.map((e, i) => ({
      ...e,
      id: e.client_id,
      name_fa: "حرکت",
      position: i,
      sets: e.sets.map((s, n) => ({ ...s, id: s.client_id, position: n })),
    })),
  };
}
function transport(sync: OutboxTransport["sync"]): OutboxTransport {
  return {
    sync,
    active: async () => null,
    detail: async () => {
      throw new Error("Not found");
    },
  };
}
test("outbox persists before sending and replays an identical mutation after an uncertain response and restart", async () => {
  const storage = memory();
  const sent: SyncBody[] = [];
  let applied: WorkoutRun | null = null;
  const first = new WorkoutOutbox(
    storage,
    transport(async (body) => {
      sent.push(body);
      assert.match((await storage.read())!, /mutation_id/);
      applied = response(body);
      throw new Error("response lost");
    }),
  );
  await first.load();
  const client = await first.create();
  await first.flush();
  assert.equal(first.getSnapshot().entries[0].problem, "network");
  first.stop();
  const second = new WorkoutOutbox(
    storage,
    transport(async (body) => {
      sent.push(body);
      return applied!;
    }),
  );
  await second.load();
  await second.flush();
  assert.deepEqual(sent[0], sent[1]);
  assert.equal(second.getSnapshot().entries[0].document.client_id, client);
  assert.equal(second.getSnapshot().entries[0].dirty, false);
  assert.equal(second.getSnapshot().entries[0].version, 1);
});
test("an edit made during sync is sent afterwards with the acknowledged version and a different mutation", async () => {
  const calls: SyncBody[] = [];
  let release: (run: WorkoutRun) => void = () => {};
  const store = new WorkoutOutbox(
    memory(),
    transport(async (body) => {
      calls.push(body);
      if (calls.length === 1)
        return new Promise<WorkoutRun>((resolve) => {
          release = resolve;
        });
      return response(body);
    }),
  );
  await store.load();
  const client = await store.create();
  const flight = store.flush();
  while (!calls.length) await new Promise((r) => setTimeout(r, 0));
  await store.change(client, (doc) => ({ ...doc, plan_name: "Updated" }));
  release(response(calls[0]));
  await flight;
  assert.equal(calls.length, 2);
  assert.equal(calls[0].plan_name, "تمرین آزاد");
  assert.equal(calls[1].plan_name, "Updated");
  assert.equal(calls[1].expected_version, 1);
  assert.notEqual(calls[0].mutation_id, calls[1].mutation_id);
  assert.equal(store.getSnapshot().entries[0].version, 2);
});
test("version conflict preserves the local document until explicit local or remote resolution", async () => {
  let remote: WorkoutRun;
  let conflict = true;
  const store = new WorkoutOutbox(memory(), {
    sync: async (body) => {
      if (conflict) throw new ApiError(409, "Conflict");
      return response(body);
    },
    active: async () => remote,
    detail: async () => remote,
  });
  await store.load();
  const client = await store.create();
  remote = response(
    {
      ...newDocument(),
      client_id: client,
      expected_version: 0,
      mutation_id: "20000000-0000-4000-8000-000000000001",
    },
    4,
  );
  await store.flush();
  assert.equal(store.getSnapshot().entries[0].problem, "conflict");
  assert.equal(store.getSnapshot().entries[0].version, 0);
  const pending = store.getSnapshot().entries[0].pending;
  await store.flush();
  assert.equal(store.getSnapshot().entries[0].pending, pending);
  await store.resolve(client, "local");
  conflict = false;
  await store.flush();
  assert.equal(store.getSnapshot().entries[0].version, 5);
});
test("remote completion cannot be overwritten; choosing remote preserves its finished status", async () => {
  let remote: WorkoutRun;
  const store = new WorkoutOutbox(memory(), {
    sync: async () => {
      throw new ApiError(409, "Finished");
    },
    active: async () => remote,
    detail: async () => remote,
  });
  await store.load();
  const client = await store.create();
  remote = response(
    {
      ...newDocument(),
      client_id: client,
      status: "completed",
      completed_at: new Date().toISOString(),
      expected_version: 0,
      mutation_id: "20000000-0000-4000-8000-000000000002",
    },
    2,
  );
  await store.flush();
  await assert.rejects(store.resolve(client, "local"));
  await store.resolve(client, "remote");
  assert.equal(store.getSnapshot().entries[0].document.status, "completed");
  assert.equal(store.getSnapshot().entries[0].dirty, false);
});
test("only one local active workout is allowed; completed offline logs survive restart", async () => {
  const storage = memory();
  const store = new WorkoutOutbox(
    storage,
    transport(async () => {
      throw new Error("offline");
    }),
  );
  await store.load();
  const client = await store.create();
  await assert.rejects(store.create());
  await store.change(client, (doc) => ({
    ...doc,
    status: "completed",
    completed_at: new Date().toISOString(),
  }));
  await store.flush();
  const restarted = new WorkoutOutbox(
    storage,
    transport(async () => {
      throw new Error("offline");
    }),
  );
  await restarted.load();
  assert.equal(restarted.getSnapshot().entries[0].document.status, "completed");
  assert.equal(restarted.getSnapshot().entries[0].dirty, true);
  await restarted.create();
  assert.equal(restarted.getSnapshot().entries.length, 2);
});
test("storage failure is visible and does not pretend an edit was saved or transmit it", async () => {
  let fail = false;
  let calls = 0;
  const store = new WorkoutOutbox(
    {
      read: async () => null,
      write: async () => {
        if (fail) throw new Error("disk full");
      },
    },
    transport(async (body) => {
      calls++;
      return response(body);
    }),
  );
  await store.load();
  const client = await store.create();
  fail = true;
  await assert.rejects(
    store.change(client, (doc) => ({ ...doc, plan_name: "unsaved" })),
  );
  assert.equal(store.getSnapshot().storageError, true);
  assert.equal(store.getSnapshot().entries[0].document.plan_name, "تمرین آزاد");
  await store.flush();
  assert.equal(calls, 0);
});
test("signed-out and stopped engines cannot send another user’s queued writes", async () => {
  let current = true;
  let calls = 0;
  const store = new WorkoutOutbox(
    memory(),
    transport(async (body) => {
      calls++;
      return response(body);
    }),
    () => current,
  );
  await store.load();
  await store.create();
  current = false;
  await store.flush();
  assert.equal(calls, 0);
  current = true;
  store.stop();
  await store.flush();
  assert.equal(calls, 0);
});
test("workout inputs enforce actual and target numeric bounds and parse backend gif/mp4 media", () => {
  assert.equal(
    actualSetFormSchema.safeParse({ reps: 0, weight: 0, rpe: null, rir: null })
      .success,
    true,
  );
  assert.equal(
    actualSetFormSchema.safeParse({
      reps: 1001,
      weight: 0,
      rpe: null,
      rir: null,
    }).success,
    false,
  );
  assert.equal(
    actualSetFormSchema.safeParse({
      reps: 10,
      weight: 12.345,
      rpe: null,
      rir: null,
    }).success,
    false,
  );
  assert.equal(
    actualSetFormSchema.safeParse({
      reps: 10,
      weight: 12.25,
      rpe: 10.1,
      rir: null,
    }).success,
    false,
  );
  assert.equal(
    targetFormSchema.safeParse({ reps: 0, weight: null }).success,
    false,
  );
  assert.equal(
    exercisePageSchema.safeParse({
      items: [],
      page: 1,
      page_size: 20,
      total: 0,
      pages: 0,
    }).success,
    true,
  );
});
test("a rejected document can be corrected without replaying the invalid mutation forever", async () => {
  const sent: SyncBody[] = [];
  const store = new WorkoutOutbox(
    memory(),
    transport(async (body) => {
      sent.push(body);
      if (sent.length === 1) throw new ApiError(422, "Invalid");
      return response(body);
    }),
  );
  await store.load();
  const client = await store.create();
  await store.flush();
  assert.equal(store.getSnapshot().entries[0].problem, "invalid");
  await store.change(client, (doc) => ({ ...doc, plan_name: "Corrected" }));
  await store.flush();
  assert.equal(sent[1].plan_name, "Corrected");
  assert.notEqual(sent[0].mutation_id, sent[1].mutation_id);
  assert.equal(store.getSnapshot().entries[0].dirty, false);
});
test("weight validation rejects sub-cent precision without rejecting legitimate decimals", () => {
  assert.equal(
    targetFormSchema.safeParse({ reps: 10, weight: 12.000001 }).success,
    false,
  );
  assert.equal(
    targetFormSchema.safeParse({ reps: 10, weight: 12.34 }).success,
    true,
  );
});

test("repeating a completed workout creates fresh identifiers, copies only logged extant exercises and resets actuals", async () => {
  const original = response({
    ...newDocument(),
    status: "completed",
    completed_at: new Date().toISOString(),
    mutation_id: "20000000-0000-4000-8000-000000000001",
    expected_version: 0,
  });
  const example = {
    id: "30000000-0000-4000-8000-000000000001",
    client_id: "30000000-0000-4000-8000-000000000001",
    position: 0,
    target_reps: 10,
    target_weight_kg: 5,
    reps: 0,
    weight_kg: 12.5,
    rpe: 8,
    rir: 2,
    completed_at: new Date().toISOString(),
  };
  original.exercises = [
    {
      id: "40000000-0000-4000-8000-000000000001",
      client_id: "40000000-0000-4000-8000-000000000001",
      exercise_id: "50000000-0000-4000-8000-000000000001",
      name_fa: "Exercise",
      position: 0,
      rest_seconds: 90,
      sets: [
        example,
        {
          ...example,
          id: "30000000-0000-4000-8000-000000000002",
          client_id: "30000000-0000-4000-8000-000000000002",
          completed_at: null,
        },
      ],
    },
  ];
  original.exercises.push({ ...original.exercises[0], exercise_id: null });
  const before = JSON.stringify(original);
  const repeated = repeatDocument(original);
  assert.equal(JSON.stringify(original), before);
  assert.notEqual(repeated.client_id, original.client_id);
  assert.equal(repeated.status, "in_progress");
  assert.equal(repeated.plan_id, null);
  assert.equal(repeated.completed_at, null);
  assert.equal(repeated.exercises.length, 1);
  assert.equal(repeated.exercises[0].sets.length, 1);
  assert.notEqual(
    repeated.exercises[0].client_id,
    original.exercises[0].client_id,
  );
  const set = repeated.exercises[0].sets[0];
  assert.notEqual(set.client_id, example.client_id);
  assert.equal(set.target_reps, null);
  assert.equal(set.target_weight_kg, 12.5);
  assert.equal(set.reps, null);
  assert.equal(set.rpe, null);
  assert.equal(set.completed_at, null);
  assert.throws(() => repeatDocument({ ...original, status: "in_progress" }));
  const storage = memory();
  const store = new WorkoutOutbox(
    storage,
    transport(async (body) => response(body)),
  );
  await store.load();
  await store.create(undefined, original);
  await assert.rejects(store.create(undefined, original));
  const restarted = new WorkoutOutbox(
    storage,
    transport(async (body) => response(body)),
  );
  await restarted.load();
  assert.equal(
    restarted.getSnapshot().entries[0].document.exercises[0].sets[0]
      .target_weight_kg,
    12.5,
  );
  await restarted.flush();
  assert.equal(restarted.getSnapshot().entries[0].dirty, false);
});
