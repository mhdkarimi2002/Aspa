import { useState } from "react";
import { useForm } from "react-hook-form";
import { addExercieseSchema, AddExercieseSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";

export function useAddExercies() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

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
    mode: "onSubmit",
    resolver: zodResolver(addExercieseSchema),
  });

  function onSubmit(data: AddExercieseSchema) {
    console.log(data);
  }

  return {
    form,
    open,
    onSubmit,
    setOpen,
    step,
    setStep,
  };
}
