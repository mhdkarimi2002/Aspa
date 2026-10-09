import { z } from "zod";
import { useSession, session } from "../auth/session";
import { request, type RequestOptions, ApiError } from "../api/client";
import { apiUrl } from "../api/runtime";
import {
  catalogSchema,
  exerciseSchema,
  exercisePageSchema,
  planSchema,
  runSchema,
} from "./contracts";
export async function featureRequest(
  path: string,
  options: RequestOptions = {},
  signal?: AbortSignal,
) {
  return useSession.getState().status === "authenticated"
    ? session.authenticated<unknown>(
        path,
        { ...options, ownerId: useSession.getState().user?.id },
        signal,
      )
    : request<unknown>(apiUrl, path, signal, options);
}
export function queryString(
  values: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? "?" + params.toString() : "";
}
export const listExercises = async (
  filters: Record<string, string | number | undefined>,
  signal?: AbortSignal,
) =>
  exercisePageSchema.parse(
    await featureRequest("/api/exercises" + queryString(filters), {}, signal),
  );
export const getExercise = async (id: string, signal?: AbortSignal) =>
  exerciseSchema.parse(
    await featureRequest("/api/exercises/" + id, {}, signal),
  );
export const getCatalog = async (
  kind: "muscle-groups" | "equipment",
  signal?: AbortSignal,
) =>
  z
    .array(catalogSchema)
    .parse(await featureRequest("/api/" + kind, {}, signal));
export const listPlans = async (archived: boolean, signal?: AbortSignal) =>
  z
    .array(planSchema)
    .parse(
      await featureRequest(
        "/api/workout-plans?include_archived=" + archived,
        {},
        signal,
      ),
    );
export const getPlan = async (id: string, signal?: AbortSignal) =>
  planSchema.parse(
    await featureRequest("/api/workout-plans/" + id, {}, signal),
  );
export async function planWrite(
  id: string | undefined,
  options: RequestOptions,
  suffix = "",
) {
  return planSchema.parse(
    await featureRequest(
      "/api/workout-plans" + (id ? "/" + id : "") + suffix,
      options,
    ),
  );
}
export const getRun = async (id: string, signal?: AbortSignal) =>
  runSchema.parse(await featureRequest("/api/workouts/" + id, {}, signal));
export async function getActiveRun(signal?: AbortSignal) {
  try {
    return runSchema.parse(
      await featureRequest("/api/workouts/active", {}, signal),
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
export const getHistory = async (
  offset: number,
  exerciseId?: string,
  signal?: AbortSignal,
  date?: string,
) =>
  z
    .array(runSchema)
    .parse(
      await featureRequest(
        "/api/workouts" +
          (exerciseId ? "/exercises/" + exerciseId + "/history" : "") +
          queryString({ offset, limit: 10, completed_date: date }),
        {},
        signal,
      ),
    );
