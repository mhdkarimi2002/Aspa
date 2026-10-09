import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  sqliteOutboxStorage,
  deleteSqliteOutbox,
  type OutboxDatabase,
} from "../src/features/workouts/sqlite-store";
test("native SQLite adapter atomically replaces an owner snapshot, binds parameters, isolates owners and deletes only the requested owner", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE workout_outboxes (owner TEXT PRIMARY KEY NOT NULL,payload TEXT NOT NULL)",
  );
  const adapter: OutboxDatabase = {
    getFirstAsync: async <T>(sql: string, ...params: string[]) =>
      (db.prepare(sql).get(...params) ?? null) as T | null,
    runAsync: async (sql: string, ...params: string[]) =>
      db.prepare(sql).run(...params),
  };
  try {
    const a = sqliteOutboxStorage(
      async () => adapter,
      "owner'; DROP TABLE workout_outboxes;--",
    );
    const b = sqliteOutboxStorage(async () => adapter, "owner-b");
    await a.write("first");
    await b.write("private-b");
    await a.write("second");
    assert.equal(await a.read(), "second");
    assert.equal(await b.read(), "private-b");
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM workout_outboxes").get()?.n,
      2,
    );
    await deleteSqliteOutbox(
      async () => adapter,
      "owner'; DROP TABLE workout_outboxes;--",
    );
    assert.equal(await a.read(), null);
    assert.equal(await b.read(), "private-b");
  } finally {
    db.close();
  }
});
