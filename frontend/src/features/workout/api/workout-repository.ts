import { api } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import type {
  CreateNewDayPayload,
  CreateNewDayResponse,
  CreateWorkoutPlanPayload,
  CreateWorkoutPlanResponse,
  GetWorkoutPlansParams,
  WorkoutPlan,
} from "./workout-types";

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
