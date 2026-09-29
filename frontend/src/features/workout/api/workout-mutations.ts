import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateWorkoutPlanPayload } from "./workout-types";
import { createPlan } from "./workout-repository";
import { WORKOUT_KEYS } from "./workout-keys";

export const useCreateWorkoutPlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWorkoutPlanPayload) => createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.plans });
    },
  });
};
