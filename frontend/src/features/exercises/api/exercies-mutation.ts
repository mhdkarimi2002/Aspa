import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addExerciese } from "./exercies-repository";
import { AddExerciesPayload } from "./exercies-type";
import { WORKOUT_KEYS } from "@/features/workout/api/workout-keys";

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
