import { create } from "zustand";

interface ThemeStore {
  theme: "light" | "dark";
  language: "fa" | "en";
}

interface ThemeActions {
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (language: "fa" | "en") => void;
}

const initialState: ThemeStore = {
  theme: "dark",
  language: "fa",
};

export const useThemeStore = create<ThemeStore & ThemeActions>((set) => ({
  ...initialState,
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
}));
