import { useQuery } from "@tanstack/react-query";
import { EXERCISES_KEYS } from "./exercies-keys";
import { getExercises, getMuscleGroups } from "./exercies-repository";

export const useGetExercises = (muscleGroupId?: string) => {
  return useQuery({
    queryKey: [...EXERCISES_KEYS.LIST, muscleGroupId],
    queryFn: () =>
      getExercises({
        page: 1,
        page_size: 50,
        direction: "asc",
        muscle_group_id: muscleGroupId,
      }),
    enabled: Boolean(muscleGroupId),
  });
};

export const useGetMuscleGroups = () => {
  return useQuery({
    queryKey: EXERCISES_KEYS.MUSCLE_GROUPS,
    queryFn: getMuscleGroups,
    staleTime: 1000 * 60 * 60 * 48,
  });
};
