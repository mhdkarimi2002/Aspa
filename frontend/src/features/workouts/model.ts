import { z } from "zod";
import type { Plan, WorkoutRun } from "../contracts";
export function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 3) | 8).toString(16);
  });
}
const id = z.string().uuid();
export const draftSetSchema = z.object({
  client_id: id,
  target_reps: z.number().nullable(),
  target_weight_kg: z.number().nullable(),
  reps: z.number().nullable(),
  weight_kg: z.number().nullable(),
  rpe: z.number().nullable(),
  rir: z.number().nullable(),
  completed_at: z.string().nullable(),
});
export const draftExerciseSchema = z.object({
  client_id: id,
  exercise_id: id.nullable(),
  name_fa: z.string(),
  rest_seconds: z.number(),
  sets: z.array(draftSetSchema),
});
export const documentSchema = z.object({
  client_id: id,
  plan_id: id.nullable(),
  plan_name: z.string(),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  status: z.enum(["in_progress", "completed", "cancelled"]),
  exercises: z.array(draftExerciseSchema),
});
export type WorkoutDocument = z.infer<typeof documentSchema>;
export type DraftSet = z.infer<typeof draftSetSchema>;
export type DraftExercise = z.infer<typeof draftExerciseSchema>;
export const syncBodySchema = documentSchema.omit({ exercises: true }).extend({
  mutation_id: id,
  expected_version: z.number().int().nonnegative(),
  exercises: z.array(draftExerciseSchema.omit({ name_fa: true })),
});
export type SyncBody = Omit<WorkoutDocument, "exercises"> & {
  mutation_id: string;
  expected_version: number;
  exercises: Omit<DraftExercise, "name_fa">[];
};
export function syncBody(document: WorkoutDocument, version: number): SyncBody {
  return {
    ...document,
    expected_version: version,
    mutation_id: uuid(),
    exercises: document.exercises.map(
      ({ name_fa: _, ...exercise }) => exercise,
    ),
  };
}
export function fromRun(run: WorkoutRun): WorkoutDocument {
  if (!run.client_id) throw new Error("Workout has no client identifier");
  return {
    client_id: run.client_id,
    plan_id: run.plan_id,
    plan_name: run.plan_name,
    started_at: run.started_at,
    completed_at: run.completed_at,
    status: run.status,
    exercises: run.exercises.map((e) => ({
      client_id: e.client_id,
      exercise_id: e.exercise_id,
      name_fa: e.name_fa,
      rest_seconds: e.rest_seconds,
      sets: e.sets.map((s) => ({
        client_id: s.client_id,
        target_reps: s.target_reps,
        target_weight_kg: s.target_weight_kg,
        reps: s.reps,
        weight_kg: s.weight_kg,
        rpe: s.rpe,
        rir: s.rir,
        completed_at: s.completed_at,
      })),
    })),
  };
}
export function newDocument(
  plan?: Plan,
  now = new Date().toISOString(),
): WorkoutDocument {
  return {
    client_id: uuid(),
    plan_id: plan?.id ?? null,
    plan_name: plan?.name ?? "تمرین آزاد",
    started_at: now,
    completed_at: null,
    status: "in_progress",
    exercises: (plan?.exercises ?? []).map((e) => ({
      client_id: uuid(),
      exercise_id: e.exercise.id,
      name_fa: e.exercise.name_fa,
      rest_seconds: e.rest_seconds,
      sets: e.target_sets.map((s) => ({
        client_id: uuid(),
        target_reps: s.target_reps,
        target_weight_kg: s.target_weight_kg,
        reps: null,
        weight_kg: null,
        rpe: null,
        rir: null,
        completed_at: null,
      })),
    })),
  };
}

export function repeatDocument(
  run: WorkoutRun,
  now = new Date().toISOString(),
): WorkoutDocument {
  if (run.status !== "completed")
    throw new Error("Only completed workouts can be repeated");
  return {
    ...newDocument(undefined, now),
    plan_name: run.plan_name,
    exercises: run.exercises
      .filter((e) => e.exercise_id !== null)
      .map((e) => ({
        client_id: uuid(),
        exercise_id: e.exercise_id,
        name_fa: e.name_fa,
        rest_seconds: e.rest_seconds,
        sets: e.sets
          .filter((s) => s.completed_at !== null)
          .map((s) => ({
            client_id: uuid(),
            target_reps:
              s.reps !== null && s.reps >= 1 && s.reps <= 100 ? s.reps : null,
            target_weight_kg: s.weight_kg,
            reps: null,
            weight_kg: null,
            rpe: null,
            rir: null,
            completed_at: null,
          })),
      }))
      .filter((e) => e.sets.length > 0),
  };
}
