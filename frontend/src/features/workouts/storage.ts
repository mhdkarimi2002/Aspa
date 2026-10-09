import AsyncStorage from "@react-native-async-storage/async-storage";
import { config } from "../../api/config";
import type { OutboxStorage } from "./outbox";
export const workoutKey = (owner: string) =>
  `aspa.workouts.v1.${config.environment}.${owner}`;
// Web preview persistence. Metro resolves storage.native.ts for Android/iOS.
export function createWorkoutStorage(owner: string): OutboxStorage {
  return {
    read: () => AsyncStorage.getItem(workoutKey(owner)),
    write: (payload) => AsyncStorage.setItem(workoutKey(owner), payload),
  };
}
export async function deleteWorkoutStorage(owner: string) {
  await AsyncStorage.removeItem(workoutKey(owner));
}
