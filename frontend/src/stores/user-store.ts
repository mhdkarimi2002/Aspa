import { User, UserRoles } from "@/shared/types/user";
import { create } from "zustand";

interface UserStoreState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  roles: UserRoles;
}

interface UserStoreActions {
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setRoles: (roles: UserRoles) => void;
}

const initialState: UserStoreState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  roles: UserRoles.Quest,
};

export const useUserStore = create<UserStoreState & UserStoreActions>(
  (set) => ({
    ...initialState,
    setUser: (user: User | null) => set({ user }),
    setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
    setIsLoading: (isLoading: boolean) => set({ isLoading }),
    setRoles: (roles: UserRoles) => set({ roles }),
  }),
);
