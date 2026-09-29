import { API_ENDPOINTS } from "@/shared/api/endpoints";
import { getAccessToken } from "@/shared/utils/get-access-token";
import { GetWorkoutPlanDetailResponse } from "./workout-types";

export async function getWorkoutPlanDetail(id: string): Promise<{
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  data?: GetWorkoutPlanDetailResponse | null;
}> {
  let isLoading = true;
  let isError = false;

  const token = await getAccessToken();
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
  const url = new URL(`${API_ENDPOINTS.workouts.plans}/${id}`, baseUrl);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    isLoading = false;
    if (!response.ok) {
      isError = true;
      return {
        isLoading,
        isError,
        error: new Error(response.statusText),
        data: null,
      };
    }

    const data = await response.json();

    return {
      isLoading,
      isError,
      error: null,
      data,
    };
  } catch (error) {
    isLoading = false;
    isError = true;
    return {
      isLoading,
      isError,
      error: error as Error,
    };
  }
}
