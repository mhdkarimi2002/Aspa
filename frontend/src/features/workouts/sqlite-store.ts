import type { OutboxStorage } from "./outbox";
export interface OutboxDatabase {
  getFirstAsync<T>(sql: string, ...params: string[]): Promise<T | null>;
  runAsync(sql: string, ...params: string[]): Promise<unknown>;
}
export function sqliteOutboxStorage(
  database: () => Promise<OutboxDatabase>,
  owner: string,
): OutboxStorage {
  return {
    read: async () => {
      const db = await database();
      const row = await db.getFirstAsync<{ payload: string }>(
        "SELECT payload FROM workout_outboxes WHERE owner = ?",
        owner,
      );
      return row?.payload ?? null;
    },
    write: async (payload) => {
      const db = await database();
      await db.runAsync(
        "INSERT INTO workout_outboxes(owner,payload) VALUES (?,?) ON CONFLICT(owner) DO UPDATE SET payload = excluded.payload",
        owner,
        payload,
      );
    },
  };
}
export async function deleteSqliteOutbox(
  database: () => Promise<OutboxDatabase>,
  owner: string,
) {
  const db = await database();
  await db.runAsync("DELETE FROM workout_outboxes WHERE owner = ?", owner);
}
