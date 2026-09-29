import { string, object, type Infer, number } from "zod";
export const createWorkoutPlanSchema = object({
  name: string().min(1, "نام برنامه را وارد کنید."),
  description: string().optional(),
});

export type CreateWorkoutPlanSchema = Infer<typeof createWorkoutPlanSchema>;

export const createNewDaySchema = object({
  name: string().min(1, "نام روز را وارد کنید."),
  position: number().min(1, "موقعیت روز را وارد کنید."),
});

export type CreateNewDaySchema = Infer<typeof createNewDaySchema>;
