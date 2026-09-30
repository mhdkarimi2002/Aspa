import { api } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import type {
  CreateNewDayPayload,
  CreateNewDayResponse,
  CreateWorkoutPlanPayload,
  CreateWorkoutPlanResponse,
  GetWorkoutPlansParams,
  UpdateDayPayload,
  WorkoutPlan,
} from "./workout-types";

import { AddExerciesPayload, AddExerciesResponse } from "./workout-types";

export async function getWorkoutPlans({
  includeArchived = false,
}: GetWorkoutPlansParams): Promise<WorkoutPlan[]> {
  return await api<WorkoutPlan[]>(API_ENDPOINTS.workouts.plans, {
    method: "GET",
    params: {
      include_archived: includeArchived,
    },
  });
}

export async function createPlan(
  payload: CreateWorkoutPlanPayload,
): Promise<CreateWorkoutPlanResponse> {
  return await api<CreateWorkoutPlanResponse>(API_ENDPOINTS.workouts.plans, {
    method: "POST",
    body: payload,
  });
}

export async function createDay(
  payload: CreateNewDayPayload,
  planId: string,
): Promise<CreateNewDayResponse> {
  return await api<CreateNewDayResponse>(
    `${API_ENDPOINTS.workouts.plans}/${planId}/days`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function deleteDay(planId: string, dayId: string) {
  return await api(`${API_ENDPOINTS.workouts.plans}/${planId}/days/${dayId}`, {
    method: "DELETE",
  });
}


export async function updateDay(
  payload: UpdateDayPayload,
  planId: string,
  dayId: string,
) {
  return await api(`${API_ENDPOINTS.workouts.plans}/${planId}/days/${dayId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function addExerciese(
  payload: AddExerciesPayload,
  plan_id: string,
  day_id: string,
): Promise<AddExerciesResponse> {
  return await api<AddExerciesResponse>(
    `${API_ENDPOINTS.workouts.plans}/${plan_id}/days/${day_id}/exercises`,
    {
      method: "POST",
      body: {
        exercise_id: payload.exercise_id,
        sets: payload.sets,
        min_reps: payload.min_reps,
        max_reps: payload.max_reps,
        rest_seconds: payload.rest_seconds,
        notes: payload.notes,
        position: payload.position,
      },
    },
  );
}

export async function deleteExercise(
  planId: string,
  dayId: string,
  itemId: string,
) {
  return await api(
    `${API_ENDPOINTS.workouts.plans}/${planId}/days/${dayId}/exercises/${itemId}`,
    { method: "DELETE" },
  );
}
