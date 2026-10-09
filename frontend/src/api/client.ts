export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  ownerId?: string;
  cookieSession?: boolean;
};
export async function request<T>(
  baseUrl: string,
  path: string,
  signal?: AbortSignal,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 8000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      signal: controller.signal,
      credentials: options.cookieSession ? "include" : undefined,
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.cookieSession ? { "X-Session-Mode": "cookie" } : {}),
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      const retry = Number(response.headers.get("Retry-After"));
      throw new ApiError(
        response.status,
        typeof data?.error?.message === "string"
          ? data.error.message
          : "Service unavailable",
        Number.isFinite(retry) ? retry : 0,
      );
    }
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
