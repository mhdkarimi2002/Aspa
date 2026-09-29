import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateWorkoutPlanMutation } from "../api/workout-mutations";
import { WORKOUT_KEYS } from "../api/workout-keys";
import type { WorkoutPlan } from "../api/workout-types";
import {
  createWorkoutPlanSchema,
  type CreateWorkoutPlanSchema,
} from "../schema";

export function useCreateWorkoutPlan() {
  const [open, setOpen] = useState(false);
  const createPlan = useCreateWorkoutPlanMutation();
  const queryClient = useQueryClient();

  const form = useForm<CreateWorkoutPlanSchema>({
    defaultValues: {
      description: "",
      name: "",
    },
    resolver: zodResolver(createWorkoutPlanSchema),
    mode: "onSubmit",
  });

  function onSubmit(data: CreateWorkoutPlanSchema) {
    createPlan.mutate(
      {
        description: data.description || null,
        name: data.name,
      },
      {
        onSuccess: (plan: WorkoutPlan) => {
          queryClient.setQueryData<WorkoutPlan[]>(
            WORKOUT_KEYS.plans,
            (current) => [...(current ?? []), plan],
          );
          form.reset();
          setOpen(false);
        },
      },
    );
  }

  return { form, onSubmit, open, setOpen };
}
