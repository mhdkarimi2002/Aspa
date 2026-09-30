import { useState } from "react";
import { useForm } from "react-hook-form";
import { addExercieseSchema, AddExercieseSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAddExercise } from "@/features/exercises/api/exercies-mutation";
import { useParams, useRouter } from "next/navigation";

export function useAddExercies(dayId: string) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [exerciseName, setExerciseName] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();

  const planId = params.id as string;
  const addExerciesMutation = useAddExercise(planId, dayId);

  const form = useForm<AddExercieseSchema>({
    defaultValues: {
      exercise_id: "",
      sets: 1,
      min_reps: 1,
      max_reps: 1,
      rest_seconds: 90,
      notes: "",
      position: 0,
    },
    mode: "onBlur",
    resolver: zodResolver(addExercieseSchema),
  });

  async function onSubmit(data: AddExercieseSchema) {
    await addExerciesMutation.mutateAsync({
      exercise_id: data.exercise_id,
      sets: data.sets,
      min_reps: data.min_reps,
      max_reps: data.max_reps,
      rest_seconds: data.rest_seconds,
      notes: data.notes,
      position: data.position,
    });
    setOpen(false);
    resetFlow();
    router.refresh();
  }

  function continueWithExercise(name: string) {
    setExerciseName(name);
    setStep(1);
  }

  async function continueVolume() {
    const valid = await form.trigger(["sets", "min_reps", "max_reps"]);
    if (valid) setStep(2);
  }

  function resetFlow() {
    form.reset();
    setStep(0);
    setExerciseName(null);
  }

  return {
    form,
    open,
    onSubmit,
    setOpen,
    step,
    setStep,
    exerciseName,
    continueWithExercise,
    continueVolume,
    resetFlow,
  };
}
