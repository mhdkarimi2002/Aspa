import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
type Preferences = {
  defaultRest: number;
  setDefaultRest: (seconds: number) => void;
  automaticRest: boolean;
  setAutomaticRest: (enabled: boolean) => void;
  language: "fa" | "en";
  setLanguage: (language: "fa" | "en") => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
};
export const usePreferences = create<Preferences>()(
  persist(
    (set) => ({
      defaultRest: 90,
      setDefaultRest: (defaultRest) => set({ defaultRest }),
      automaticRest: true,
      setAutomaticRest: (automaticRest) => set({ automaticRest }),
      language: "fa",
      setLanguage: (language) => set({ language }),
      theme: "light",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "aspa-preferences-v1",
      storage: createJSONStorage(() => AsyncStorage),
      skipHydration: true,
    },
  ),
);
