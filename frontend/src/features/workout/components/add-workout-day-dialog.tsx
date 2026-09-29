"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddPlanDay } from "../hooks/use-add-plan-day";
import { Controller } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";

const AddWorkoutDayDialog = ({ planId }: { planId: string }) => {
  const { open, setOpen, form, onSubmit } = useAddPlanDay(planId);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger>
        <Button type="button" className="h-11">
          <Plus className="size-4" aria-hidden="true" />
          روز جدید
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="bg-card">
        <DialogHeader>
          <DialogTitle>روز جدید</DialogTitle>
          <DialogDescription>
            نام روز را بنویس. مثلاً سینه یا روز اول.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Controller
            name="name"
            control={form.control}
            render={({ field, formState }) => (
              <Field className="flex flex-col gap-2">
                <Label htmlFor="day-name">نام روز</Label>
                <Input
                  id="day-name"
                  {...field}
                  autoComplete="off"
                  className="h-11"
                />

                <FieldError id={field.name} errors={[formState.errors.name]} />
              </Field>
            )}
          />
          <Controller
            name="position"
            control={form.control}
            render={({ field, formState }) => (
              <Field className="flex flex-col gap-2">
                <Label htmlFor="day-position">موقعیت روز</Label>
                <Input
                  id="day-position"
                  name={field.name}
                  ref={field.ref}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChange={(event) => {
                    const next = event.target.valueAsNumber;
                    field.onChange(Number.isNaN(next) ? 0 : next);
                  }}
                  aria-invalid={formState.errors.position ? true : undefined}
                  aria-describedby={
                    formState.errors.position ? field.name : undefined
                  }
                  className="h-11"
                />
                <FieldError
                  id={field.name}
                  errors={[formState.errors.position]}
                />
              </Field>
            )}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <DialogClose
              type="button"
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-md border border-border px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
            >
              انصراف
            </DialogClose>
            <Button type="submit" className="h-11">
              افزودن روز
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddWorkoutDayDialog;
