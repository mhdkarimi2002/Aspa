import { useQuery } from "@tanstack/react-query";
import { EXERCISES_KEYS } from "./exercies-keys";
import { getExercises } from "./exercies-repository";

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
