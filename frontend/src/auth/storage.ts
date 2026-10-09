import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { config } from "../api/config";
import type { TokenStorage } from "./session-core";
// Web credentials live in the backend's HttpOnly cookie, never JavaScript storage.
const logoutKey = `aspa.signed-out.${config.environment}`;
const key = `aspa.refresh.${config.environment}`;
export const tokenStorage: TokenStorage = {
  read: () =>
    Platform.OS === "web"
      ? AsyncStorage.getItem(logoutKey).then((value) =>
          value ? null : "cookie-session",
        )
      : SecureStore.getItemAsync(key),
  write: async (token) => {
    if (Platform.OS === "web") await AsyncStorage.removeItem(logoutKey);
    else
      await SecureStore.setItemAsync(key, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
  },
  clear: async () => {
    if (Platform.OS === "web") await AsyncStorage.setItem(logoutKey, "true");
    else await SecureStore.deleteItemAsync(key);
  },
};
