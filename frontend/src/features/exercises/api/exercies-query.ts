import { useQuery } from "@tanstack/react-query";
import { EXERCISES_KEYS } from "./exercies-keys";
import { getExercises, getMuscleGroups } from "./exercies-repository";

export const useGetExercises = () => {
  return useQuery({
    queryKey: EXERCISES_KEYS.LIST,
    queryFn: () =>
      getExercises({
        page: 1,
        page_size: 10,
        direction: "asc",
      }),
  });
};

export const useGetMuscleGroups = () => {
  return useQuery({
    queryKey: EXERCISES_KEYS.MUSCLE_GROUPS,
    queryFn: getMuscleGroups,
    staleTime: 1000 * 60 * 60 * 48,
  });
};
