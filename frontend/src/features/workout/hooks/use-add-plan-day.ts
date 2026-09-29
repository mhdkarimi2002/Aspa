import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { CreateNewDaySchema, createNewDaySchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateDayMutation } from "../api/workout-mutations";

export function useAddPlanDay(planId: string) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const form = useForm<CreateNewDaySchema>({
    defaultValues: {
      name: "",
      position: 0,
    },
    resolver: zodResolver(createNewDaySchema),
    mode: "onSubmit",
  });

  const addNewDayMutation = useCreateDayMutation();

  function onSubmit(data: CreateNewDaySchema) {
    addNewDayMutation.mutate(
      {
        payload: data,
        planId,
      },
      {
        onSuccess: () => {
          form.reset();
          setOpen(false);
          router.refresh();
        },
      },
    );
  }
  return {
    open,
    setOpen,
    form,
    onSubmit,
  };
}
