import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateNewDayPayload,
  CreateWorkoutPlanPayload,
} from "./workout-types";
import { createDay, createPlan } from "./workout-repository";
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

export const useCreateDayMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      planId,
    }: {
      payload: CreateNewDayPayload;
      planId: string;
    }) => createDay(payload, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.plans });
    },
  });
};
