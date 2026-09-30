import { api } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import {
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
