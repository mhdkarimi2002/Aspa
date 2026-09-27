import { getClientAccessToken } from "@/shared/utils/access-token";
import { ApiError, toApiError } from "./error";
import { handleApiError } from "./handle-error";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

function requestUrl(path: string) {
  if (!API_BASE_URL) return path;
  return new URL(path, API_BASE_URL).toString();
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  silent?: boolean;
};

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { body, headers, silent, ...init } = options;

  let response: Response;

  try {
    response = await fetch(requestUrl(path), {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...authHeader(),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "network_error", "ارتباط با سرور برقرار نشد");
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const payload = await readJson(response);

  if (!response.ok) {
    const error = toApiError(response.status, payload);
    if (!silent) handleApiError(error, path);
    throw error;
  }

  return payload as T;
}

function authHeader(): Record<string, string> {
  const token = getClientAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
