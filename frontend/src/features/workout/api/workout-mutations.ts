import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  addExerciese,
  createDay,
  createPlan,
  deleteDay,
  deleteExercise,
  updateDay,
} from "./workout-repository";
import { WORKOUT_KEYS } from "./workout-keys";
import type {
  AddExerciesPayload,
  CreateNewDayPayload,
  CreateWorkoutPlanPayload,
  UpdateDayPayload,
} from "./workout-types";
import { toast } from "react-hot-toast";

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

export const useDeleteDayMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, dayId }: { planId: string; dayId: string }) =>
      deleteDay(planId, dayId),
    onSuccess: () => {
      toast.success("روز با موفقیت حذف شد");
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.plans });
    },
  });
};

type UpdateDayPayloads = {
  payload: UpdateDayPayload;
  planId: string;
  dayId: string;
};

export const useUpdateDayMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, planId, dayId }: UpdateDayPayloads) =>
      updateDay(payload, planId, dayId),
    onSuccess: () => {
      toast.success("روز با موفقیت به روز شد");
    },
    onError: () => {
      toast.error("خطا در به روز رسانی روز");
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
    onSuccess: () => {
      toast.success("تمرین با موفقیت اضافه شد");
    },
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
