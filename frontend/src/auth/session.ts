import { cacheIdentity, readIdentity } from "./identity-cache";
import { create } from "zustand";
import { Session } from "./session-core";
import { tokenStorage } from "./storage";
import { apiUrl, cookieSession } from "../api/runtime";
import { request, ApiError } from "../api/client";
import type { User } from "./schemas";
type State = {
  status: "loading" | "guest" | "authenticated" | "unavailable";
  user: User | null;
  offline: boolean;
  setUser: (user: User) => void;
};
export const useSession = create<State>((set) => ({
  status: "loading",
  user: null,
  offline: false,
  setUser: (user) => {
    if (
      useSession.getState().status === "authenticated" &&
      useSession.getState().user?.id === user.id
    ) {
      set({ user });
      cacheIdentity(user);
    }
  },
}));
export const session = new Session(
  tokenStorage,
  (path, options, signal) => {
    if (
      cookieSession &&
      ["/api/auth/refresh", "/api/auth/logout"].includes(path)
    ) {
      return request(apiUrl, path.replace("/auth/", "/auth/session/"), signal, {
        method: "POST",
        cookieSession: true,
      });
    }
    return request(apiUrl, path, signal, options);
  },
  (auth) => {
    cacheIdentity(auth?.user ?? null);
    useSession.setState({
      offline: false,
      status: auth ? "authenticated" : "guest",
      user: auth?.user ?? null,
    });
  },
);
let initialization: Promise<void> | null = null;
export function initializeSession() {
  if (initialization) return initialization;
  useSession.setState({ status: "loading" });
  initialization = session
    .restore()
    .then(() => {
      if (useSession.getState().status === "loading")
        useSession.setState({ status: "guest" });
    })
    .catch(async (error: unknown) => {
      if (useSession.getState().status === "guest") return;
      const cached =
        !(error instanceof ApiError && [401, 403].includes(error.status)) &&
        (await tokenStorage.read())
          ? await readIdentity()
          : null;
      if (cached)
        useSession.setState({
          status: "authenticated",
          user: cached,
          offline: true,
        });
      else useSession.setState({ status: "unavailable" });
    })
    .finally(() => {
      initialization = null;
    });
  return initialization;
}
