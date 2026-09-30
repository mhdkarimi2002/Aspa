"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormProvider } from "react-hook-form";
import { useAddExercies } from "../../hooks/use-add-exercies";
import SelectExercies from "./select-exercies";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AddExerciesDialog = () => {
  const { form, open, onSubmit, setOpen, step, setStep } = useAddExercies();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset();
          setStep(0);
        }
      }}
    >
      <DialogTrigger>
        <Button type="button" className="h-11">
          <Plus className="size-4" aria-hidden="true" />
          حرکت
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-x-hidden overflow-y-auto overscroll-contain sm:max-w-lg">
        <div aria-hidden="true" className="-mx-6 -mt-6 h-1 shrink-0 bg-primary" />
        <DialogHeader className="shrink-0 pe-8">
          <DialogTitle className="text-xl font-semibold">
            حرکت جدید
          </DialogTitle>
          <DialogDescription>
            عضله را فیلتر کن و حرکت را از همان لیست بردار.
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {step === 0 ? (
              <SelectExercies onContinue={() => setStep(1)} />
            ) : null}
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default AddExerciesDialog;
