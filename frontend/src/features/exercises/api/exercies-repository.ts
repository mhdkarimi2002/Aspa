import { api } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import {
  AddExerciesPayload,
  AddExerciesResponse,
  GetExercisesParams,
  GetExercisesResponse,
  MuscleGroup,
} from "./exercies-type";

export async function getExercises(
  params: GetExercisesParams,
): Promise<GetExercisesResponse> {
  return await api<GetExercisesResponse>(API_ENDPOINTS.exercies.list, {
    method: "GET",
    params: {
      page: params.page,
      page_size: params.page_size,
      search: params.search,
      muscle_group_id: params.muscle_group_id,
      equipment_id: params.equipment_id,
      difficulty: params.difficulty,
      sort: params.sort,
    },
  });
}

export async function getMuscleGroups(): Promise<MuscleGroup[]> {
  return await api<MuscleGroup[]>(API_ENDPOINTS.exercies.muscleGroups, {
    method: "GET",
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
