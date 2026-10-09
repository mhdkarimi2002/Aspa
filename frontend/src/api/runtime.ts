import { Platform } from "react-native";
import { config } from "./config";
// Static web uses the same-origin API proxy; Expo development uses the configured API.
export const apiUrl = Platform.OS === "web" && !__DEV__ ? "" : config.apiUrl;
export const cookieSession = Platform.OS === "web";
