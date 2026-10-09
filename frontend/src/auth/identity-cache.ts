import AsyncStorage from "@react-native-async-storage/async-storage";
import { userSchema, type User } from "./schemas";
import { config } from "../api/config";
// Only a validated profile is cached. Tokens remain in SecureStore/HttpOnly cookies.
const key = `aspa.identity.v1.${config.environment}`;
let writes: Promise<void> = Promise.resolve();
export function cacheIdentity(user: User | null) {
  writes = writes
    .catch(() => {})
    .then(() =>
      user
        ? AsyncStorage.setItem(key, JSON.stringify(user))
        : AsyncStorage.removeItem(key),
    );
  void writes.catch(() => {});
}
export async function readIdentity() {
  await writes.catch(() => {});
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? userSchema.parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
