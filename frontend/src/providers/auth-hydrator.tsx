"use client";

import { getClientAccessToken } from "@/shared/utils/access-token";
import { useUserStore } from "@/stores/user-store";
import { useLayoutEffect } from "react";

export function AuthHydrator() {
  const setIsAuthenticated = useUserStore((state) => state.setIsAuthenticated);

  useLayoutEffect(() => {
    setIsAuthenticated(Boolean(getClientAccessToken()));
  }, [setIsAuthenticated]);

  return null;
}
