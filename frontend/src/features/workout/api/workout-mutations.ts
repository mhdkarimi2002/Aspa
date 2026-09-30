import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createDay, createPlan } from "./workout-repository";
import { WORKOUT_KEYS } from "./workout-keys";
import { addExerciese } from "@/features/exercises/api/exercies-repository";
import type { AddExerciesPayload } from "@/features/exercises/api/exercies-type";
import type {
  CreateNewDayPayload,
  CreateWorkoutPlanPayload,
} from "./workout-types";

export const useCreateWorkoutPlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWorkoutPlanPayload) => createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.plans });
    },
  });
};

type CreateDayPayload = {
  payload: CreateNewDayPayload;
  planId: string;
};

export const useCreateDayMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, planId }: CreateDayPayload) =>
      createDay(payload, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.plans });
    },
  });
};

type AddExerciesPayloads = {
  payload: AddExerciesPayload;
  planId: string;
  dayId: string;
};

export const useAddExercies = () => {
  return useMutation({
    mutationFn: ({ payload, planId, dayId }: AddExerciesPayloads) =>
      addExerciese(payload, planId, dayId),
  });
};
