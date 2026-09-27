import type { ApiError } from "./error";

export function handleApiError(error: ApiError, path: string) {
  if (typeof window === "undefined") return;
  if (error.status !== 401 || path.startsWith("/api/auth")) return;
  if (window.location.pathname === "/login") return;

  window.location.assign("/login");
}
