"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormProvider } from "react-hook-form";
import { useAddExercies } from "../../hooks/use-add-exercies";
import ExerciseRest from "./exercise-rest";
import ExerciseVolume from "./exercise-volume";
import SelectExercies from "./select-exercies";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const steps = [
  {
    id: 0,
    label: "انتخاب",
    title: "حرکت جدید",
    description: "عضله را فیلتر کن و حرکت را از همان لیست بردار.",
  },
  {
    id: 1,
    label: "حجم",
    title: "ست و تکرار",
    description: "تعداد ست و بازهٔ تکرار را مشخص کن.",
  },
  {
    id: 2,
    label: "استراحت",
    title: "استراحت و یادداشت",
    description: "استراحت، ترتیب و یادداشت اختیاری را بنویس.",
  },
] as const;

const AddExerciesDialog = ({ dayId }: { dayId: string }) => {
  const {
    form,
    open,
    onSubmit,
    setOpen,
    step,
    exerciseName,
    continueWithExercise,
    continueVolume,
    setStep,
    resetFlow,
  } = useAddExercies(dayId);

  const current = steps[step] ?? steps[0];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetFlow();
      }}
    >
      <DialogTrigger>
        <Button variant="link" size={"icon-sm"} type="button">
          <Plus className="size-5" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-x-hidden overflow-y-auto overscroll-contain sm:max-w-lg">
        <div className="-mx-6 -mt-6 flex h-1 shrink-0 gap-1" aria-hidden="true">
          {steps.map((item) => (
            <span
              key={item.id}
              className={`h-1 flex-1 ${item.id <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        <DialogHeader className="shrink-0 pe-8">
          <p className="text-sm text-muted-foreground">
            گام {(step + 1).toLocaleString("fa-IR")} از{" "}
            {steps.length.toLocaleString("fa-IR")}: {current.label}
          </p>
          <DialogTitle className="text-xl font-semibold">
            {current.title}
          </DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            onSubmit={(event) => {
              if (step < 2) {
                event.preventDefault();
                return;
              }
              void form.handleSubmit(onSubmit)(event);
            }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div
              className={step === 0 ? "flex min-h-0 flex-1 flex-col" : "hidden"}
            >
              <SelectExercies onContinue={continueWithExercise} />
            </div>
            {step === 1 ? (
              <ExerciseVolume
                exerciseName={exerciseName ?? "حرکت انتخاب‌شده"}
                onBack={() => setStep(0)}
                onContinue={() => void continueVolume()}
              />
            ) : null}
            {step === 2 ? <ExerciseRest onBack={() => setStep(1)} /> : null}
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default AddExerciesDialog;
