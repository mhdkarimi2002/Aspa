import { z } from "zod";
const id = z.string().uuid();
export const catalogSchema = z.object({ id, name_fa: z.string() });
export const exerciseSchema = z.object({
  id,
  name_fa: z.string(),
  description_fa: z.string().nullable(),
  equipment: catalogSchema.nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  image_key: z.string().nullable(),
  video_key: z.string().nullable(),
  is_custom: z.boolean(),
  can_edit: z.boolean(),
  primary_muscles: z.array(catalogSchema),
  secondary_muscles: z.array(catalogSchema),
  instruction_steps: z.array(
    z.object({ id, position: z.number(), text_fa: z.string() }),
  ),
  media: z.array(
    z.object({
      id,
      position: z.number(),
      media_type: z.enum(["gif", "mp4"]),
      object_key: z.string(),
    }),
  ),
});
export const exercisePageSchema = z.object({
  items: z.array(exerciseSchema),
  page: z.number(),
  page_size: z.number(),
  total: z.number(),
  pages: z.number(),
});
const decimal = z.union([z.string(), z.number()]).transform(Number);
export const targetSchema = z.object({
  target_reps: z.number().int().min(1).max(100),
  target_weight_kg: decimal.nullable(),
});
export const planItemSchema = z.object({
  id,
  exercise: catalogSchema,
  position: z.number(),
  sets: z.number(),
  min_reps: z.number(),
  max_reps: z.number(),
  rest_seconds: z.number(),
  notes: z.string().nullable(),
  target_sets: z.array(targetSchema),
});
export const planSchema = z.object({
  id,
  name: z.string(),
  description: z.string().nullable(),
  is_archived: z.boolean(),
  is_active: z.boolean(),
  exercises: z.array(planItemSchema),
  muscle_coverage: z.array(
    catalogSchema.extend({
      primary_exercise_count: z.number(),
      secondary_exercise_count: z.number(),
    }),
  ),
  created_at: z.string(),
  updated_at: z.string(),
});
export const runSetSchema = z.object({
  id,
  client_id: id,
  position: z.number(),
  target_reps: z.number().nullable(),
  target_weight_kg: decimal.nullable(),
  reps: z.number().nullable(),
  weight_kg: decimal.nullable(),
  rpe: decimal.nullable(),
  rir: z.number().nullable(),
  completed_at: z.string().nullable(),
});
export const runExerciseSchema = z.object({
  id,
  client_id: id,
  exercise_id: id.nullable(),
  name_fa: z.string(),
  position: z.number(),
  rest_seconds: z.number(),
  sets: z.array(runSetSchema),
});
export const runSchema = z.object({
  id,
  client_id: id.nullable(),
  plan_id: id.nullable(),
  plan_name: z.string(),
  status: z.enum(["in_progress", "completed", "cancelled"]),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  version: z.number().int(),
  exercises: z.array(runExerciseSchema),
});
export type Exercise = z.infer<typeof exerciseSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type Plan = z.infer<typeof planSchema>;
export type PlanItem = z.infer<typeof planItemSchema>;
export type WorkoutRun = z.infer<typeof runSchema>;
export const planFormSchema = z.object({
  name: z.string().trim().min(1, "نام برنامه را وارد کنید.").max(120),
  description: z.string().trim().max(2000),
});
export const targetFormSchema = z.object({
  reps: z.number().int().min(1).max(100),
  weight: z
    .number()
    .min(0)
    .max(1000)
    .multipleOf(0.01, "وزن حداکثر دو رقم اعشار دارد.")
    .nullable(),
});
export const actualSetFormSchema = z.object({
  reps: z.number().int().min(0).max(1000),
  weight: z
    .number()
    .min(0)
    .max(1000)
    .multipleOf(0.01, "وزن حداکثر دو رقم اعشار دارد."),
  rpe: z.number().min(0).max(10).multipleOf(0.1).nullable(),
  rir: z.number().int().min(0).max(20).nullable(),
});
