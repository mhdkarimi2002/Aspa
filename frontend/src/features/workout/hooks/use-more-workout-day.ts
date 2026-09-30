import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateNewDaySchema, createNewDaySchema } from "../schema";
import {
  useDeleteDayMutation,
  useUpdateDayMutation,
} from "../api/workout-mutations";

export function useMoreWorkoutDay(
  planId: string,
  day: { id: string; name: string; position: number },
) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "edit" | "delete">("menu");
  const updateDay = useUpdateDayMutation();
  const deleteDay = useDeleteDayMutation();

  const form = useForm<CreateNewDaySchema>({
    defaultValues: {
      name: day.name,
      position: day.position,
    },
    resolver: zodResolver(createNewDaySchema),
    mode: "onSubmit",
  });

  function close() {
    setOpen(false);
    setView("menu");
    form.reset({ name: day.name, position: day.position });
  }

  function onOpenChange(next: boolean) {
    if (next) {
      setOpen(true);
      return;
    }
    close();
  }

  function openEdit() {
    form.reset({ name: day.name, position: day.position });
    setView("edit");
  }

  function onSubmit(data: CreateNewDaySchema) {
    updateDay.mutate(
      { payload: data, planId, dayId: day.id },
      {
        onSuccess: () => {
          close();
          router.refresh();
        },
      },
    );
  }

  function onDelete() {
    deleteDay.mutate(
      { planId, dayId: day.id },
      {
        onSuccess: () => {
          close();
          router.refresh();
        },
      },
    );
  }

  return {
    open,
    view,
    setView,
    form,
    onOpenChange,
    openEdit,
    onSubmit,
    onDelete,
    updating: updateDay.isPending,
    deleting: deleteDay.isPending,
  };
}
