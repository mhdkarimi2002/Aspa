export interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  days: { id: string; name: string }[];
  created_at: string;
  updated_at: string;
}

export interface GetWorkoutPlansParams {
  includeArchived: boolean;
}

export interface CreateWorkoutPlanPayload {
  name: string;
  description: string | null;
}

export interface CreateWorkoutPlanResponse extends WorkoutPlan {}

export interface WorkoutPlanDayExercise {
  id: string;
  exercise: {
    id: string;
    name_fa: string;
    name_en: string;
  };
  position: number;
  sets: number;
  min_reps: number;
  max_reps: number;
  rest_seconds: number;
  notes: string | null;
}

export interface WorkoutPlanDay {
  id: string;
  name: string;
  position: number;
  exercises: WorkoutPlanDayExercise[];
}

export interface GetWorkoutPlanDetailResponse {
  id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  days: WorkoutPlanDay[];
  created_at: string;
  updated_at: string;
}

export interface CreateNewDayPayload {
  name: string;
  position: number;
}

export interface DayExercise {
  id: string;
  name: string;
  position: number;
  exercises: [
    {
      id: string;
      exercise: {
        id: string;
        name_fa: string;
        name_en: string;
      };
      position: number;
      sets: number;
      min_reps: number;
      max_reps: number;
      rest_seconds: number;
      notes: string;
    },
  ];
}

export interface CreateNewDayResponse {
  id: string;
  name: string;
  description: string;
  is_archived: boolean;
  days: DayExercise[];
  created_at: string;
  updated_at: string;
}
