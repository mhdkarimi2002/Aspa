import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { config } from "../../api/config";
import { sqliteOutboxStorage, deleteSqliteOutbox } from "./sqlite-store";
import type { OutboxStorage } from "./outbox";
export const workoutKey = (owner: string) =>
  `aspa.workouts.v1.${config.environment}.${owner}`;
let connection: Promise<SQLite.SQLiteDatabase> | null = null;
function database() {
  if (!connection) {
    connection = SQLite.openDatabaseAsync(
      `aspa-workouts-${config.environment}.db`,
    )
      .then(async (db) => {
        await db.execAsync(
          "PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; CREATE TABLE IF NOT EXISTS workout_outboxes (owner TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL);",
        );
        return db;
      })
      .catch((error) => {
        connection = null;
        throw error;
      });
  }
  return connection;
}
export function createWorkoutStorage(owner: string): OutboxStorage {
  const store = sqliteOutboxStorage(database, owner);
  return {
    write: store.write,
    read: async () => {
      const existing = await store.read();
      if (existing !== null) return existing;
      const legacy = await AsyncStorage.getItem(workoutKey(owner));
      if (legacy !== null) {
        await store.write(legacy);
        await AsyncStorage.removeItem(workoutKey(owner));
      }
      return legacy;
    },
  };
}
export async function deleteWorkoutStorage(owner: string) {
  await deleteSqliteOutbox(database, owner);
  await AsyncStorage.removeItem(workoutKey(owner));
}
