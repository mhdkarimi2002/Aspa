import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addExerciese,
  createDay,
  createPlan,
  deleteExercise,
} from "./workout-repository";
import { WORKOUT_KEYS } from "./workout-keys";
import type {
  AddExerciesPayload,
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

export function useAddExercise(plan_id: string, day_id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddExerciesPayload) =>
      addExerciese(payload, plan_id, day_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.plans });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      planId,
      dayId,
      itemId,
    }: {
      planId: string;
      dayId: string;
      itemId: string;
    }) => deleteExercise(planId, dayId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.plans });
      router.refresh();
    },
  });
}
