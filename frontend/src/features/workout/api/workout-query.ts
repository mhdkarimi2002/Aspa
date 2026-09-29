import { useQuery } from "@tanstack/react-query";
import { getWorkoutPlans } from "./workout-repository";
import { WORKOUT_KEYS } from "./workout-keys";

export const useWorkoutPlans = () => {
  return useQuery({
    queryKey: WORKOUT_KEYS.plans,
    queryFn: () => getWorkoutPlans({ includeArchived: false }),
  });
};
