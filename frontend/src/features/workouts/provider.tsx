import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { AppState, Platform } from "react-native";
import { createWorkoutStorage } from "./storage";
import { useSession, session } from "../../auth/session";
import { runSchema } from "../contracts";
import { getActiveRun, getRun } from "../api";
import { WorkoutOutbox } from "./outbox";
const Context = createContext<WorkoutOutbox | null>(null);
export function WorkoutProvider({ children }: { children: ReactNode }) {
  const owner = useSession((s) => s.user?.id);
  const engine = useMemo(
    () =>
      owner
        ? new WorkoutOutbox(
            {
              read: () => createWorkoutStorage(owner).read(),
              write: (value) => {
                if (useSession.getState().user?.id !== owner)
                  return Promise.reject(new Error("Account changed"));
                return createWorkoutStorage(owner).write(value);
              },
            },
            {
              sync: async (body) =>
                runSchema.parse(
                  await session.authenticated("/api/workouts/sync", {
                    method: "PUT",
                    ownerId: owner,
                    body,
                  }),
                ),
              active: () => getActiveRun(),
              detail: (id) => getRun(id),
            },
            () =>
              useSession.getState().status === "authenticated" &&
              useSession.getState().user?.id === owner,
          )
        : null,
    [owner],
  );
  useEffect(() => {
    if (!engine) return;
    engine.start();
    let live = true;
    const retry = () => {
      if (live) void engine.flush().then(() => engine.restoreActive());
    };
    void engine.load().then(retry);
    const timer = setInterval(retry, 15000);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") retry();
    });
    if (Platform.OS === "web") window.addEventListener("online", retry);
    return () => {
      live = false;
      engine.stop();
      clearInterval(timer);
      sub.remove();
      if (Platform.OS === "web") window.removeEventListener("online", retry);
    };
  }, [engine]);
  return <Context.Provider value={engine}>{children}</Context.Provider>;
}
const empty = {
  loaded: false,
  entries: [],
  storageError: false,
  syncing: false,
};
export function useWorkouts() {
  const engine = useContext(Context);
  const snapshot = useSyncExternalStore(
    engine?.subscribe ?? (() => () => {}),
    engine?.getSnapshot ?? (() => empty),
    () => empty,
  );
  return { engine, ...snapshot };
}
