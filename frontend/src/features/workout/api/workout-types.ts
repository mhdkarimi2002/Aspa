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
