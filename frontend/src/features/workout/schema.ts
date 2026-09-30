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

export const addExercieseSchema = object({
  exercise_id: string().min(1),
  sets: number()
    .min(1)
    .refine((value) => value > 0, {
      message: "تعداد ست ها باید بیشتر از 0 باشد.",
    }),
  min_reps: number()
    .min(1)
    .refine((value) => value > 0, {
      message: "تعداد تکرارهای کمتر باید بیشتر از 0 باشد.",
    }),
  max_reps: number()
    .min(1)
    .refine((value) => value > 0, {
      message: "تعداد تکرارهای بیشتر باید بیشتر از 0 باشد.",
    }),
  rest_seconds: number(),
  notes: string().optional(),
  position: number().min(0),
});

export type AddExercieseSchema = Infer<typeof addExercieseSchema>;
