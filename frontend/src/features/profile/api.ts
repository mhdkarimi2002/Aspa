import { z } from "zod";
import { featureRequest, queryString } from "../api";
const number = z.union([z.number(), z.string()]).transform(Number);
export const bucketSchema = z.object({
  date: z.string(),
  workouts: z.number(),
  duration_seconds: z.number(),
  volume_kg: number,
  reps: z.number(),
});
export const statisticsSchema = z.object({
  workout_count: z.number(),
  duration_seconds: z.number(),
  volume_kg: number,
  reps: z.number(),
  last_week_duration_seconds: z.number(),
  weeks: z.array(bucketSchema),
});
export type Statistics = z.infer<typeof statisticsSchema>;
export type Bucket = z.infer<typeof bucketSchema>;
export type StatisticsRange = "three_months" | "year" | "all_time";
export const getStatistics = async (
  range: StatisticsRange,
  language: string,
  signal?: AbortSignal,
) =>
  statisticsSchema.parse(
    await featureRequest(
      "/api/workouts/statistics" +
        queryString({
          weeks: range === "year" ? 52 : 13,
          all_time: range === "all_time" ? "true" : undefined,
          week_start: language === "fa" ? 5 : 0,
        }),
      {},
      signal,
    ),
  );
export const getCalendar = async (month: string, signal?: AbortSignal) =>
  z
    .array(bucketSchema)
    .parse(
      await featureRequest(
        "/api/workouts/calendar" + queryString({ month }),
        {},
        signal,
      ),
    );

export const getProvinces = async (signal?: AbortSignal) =>
  z
    .array(z.object({ id: z.string(), fa: z.string(), en: z.string() }))
    .parse(await featureRequest("/api/users/provinces", {}, signal));
