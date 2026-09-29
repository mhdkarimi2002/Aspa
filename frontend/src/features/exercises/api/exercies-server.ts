import { API_ENDPOINTS } from "@/shared/api/endpoints";
import { getAccessToken } from "@/shared/utils/get-access-token";
import { Equipment, Exercise, MuscleGroup } from "./exercies-type";

export async function getExercisesServer({
  muscleGroupId,
  equipmentId,
}: {
  muscleGroupId?: string;
  equipmentId?: string;
} = {}): Promise<{
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  data?: Exercise[];
}> {
  let isLoading = true;
  let isError = false;

  const token = await getAccessToken();
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  try {
    const url = new URL(API_ENDPOINTS.exercies.list, baseUrl);
    if (muscleGroupId) {
      url.searchParams.set("muscle_group_id", muscleGroupId);
    }
    if (equipmentId) {
      url.searchParams.set("equipment_id", equipmentId);
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    isLoading = false;
    if (!response.ok) {
      return {
        isLoading,
        isError: true,
        error: new Error("Failed to fetch exercises"),
      };
    }

    const data = await response.json();

    return {
      isLoading,
      isError: false,
      data: data.items,
    };
  } catch (error) {
    isError = true;
    isLoading = false;
    return {
      isLoading,
      isError,
      error: error as Error,
    };
  }
}

export async function getMusleGroupServer(): Promise<{
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  data?: MuscleGroup[];
}> {
  let isLoading = true;
  let isError = false;

  const token = await getAccessToken();
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  try {
    const response = await fetch(
      new URL(API_ENDPOINTS.exercies.muscleGroups, baseUrl),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    isLoading = false;
    if (!response.ok) {
      return {
        isLoading,
        isError: true,
        error: new Error("Failed to fetch muscle groups"),
      };
    }

    const data = await response.json();

    return {
      isLoading,
      isError: false,
      data: data,
    };
  } catch (error) {
    isError = true;
    isLoading = false;
    return {
      isLoading,
      isError,
      error: error as Error,
    };
  }
}

export async function getEquipmentServer(): Promise<{
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  data?: Equipment[];
}> {
  let isLoading = true;
  let isError = false;

  const token = await getAccessToken();
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

  try {
    const response = await fetch(
      new URL(API_ENDPOINTS.exercies.equipment, baseUrl),
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    isLoading = false;
    if (!response.ok) {
      return {
        isLoading,
        isError: true,
        error: new Error("Failed to fetch equipment"),
      };
    }

    const data = await response.json();

    return {
      isLoading,
      isError: false,
      data,
    };
  } catch (error) {
    isError = true;
    isLoading = false;
    return {
      isLoading,
      isError,
      error: error as Error,
    };
  }
}
