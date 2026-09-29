import { string, object, type Infer } from "zod";
export const createWorkoutPlanSchema = object({
  name: string().min(1, "نام برنامه را وارد کنید."),
  description: string().optional(),
});

export type CreateWorkoutPlanSchema = Infer<typeof createWorkoutPlanSchema>;
