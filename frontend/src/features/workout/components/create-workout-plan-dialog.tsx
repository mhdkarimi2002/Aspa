"use client";
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
import { useCreateWorkoutPlan } from "../hooks/use-create-workout-plan";
import { Controller } from "react-hook-form";
import { Field, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const CreateWorkoutPlanDialog = () => {
  const { open, setOpen, onSubmit, form } = useCreateWorkoutPlan();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        form.reset();
      }}
    >
      <DialogTrigger>
        <Button type="button" className="h-11">
          <Plus className="size-4" aria-hidden="true" />
          برنامه جدید
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="bg-card">
        <DialogHeader>
          <DialogTitle>برنامه جدید</DialogTitle>
          <DialogDescription>
            نام برنامه را بنویس. توضیح اختیاری است.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <Label htmlFor="plan-name">نام برنامه</Label>
                  <Input
                    id="plan-name"
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    required
                    aria-invalid={form.formState.errors.name ? true : undefined}
                    aria-describedby={
                      form.formState.errors.name ? "plan-name-error" : undefined
                    }
                    className="h-11"
                    autoComplete="off"
                  />

                  <FieldError
                    id={field.name}
                    errors={[form.formState.errors.name]}
                  />
                </Field>
              )}
            />
          </div>
          <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
              <Field>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="plan-description">توضیحات</Label>
                  <textarea
                    id="plan-description"
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={
                      form.formState.errors.description ? true : undefined
                    }
                    aria-describedby={
                      form.formState.errors.description
                        ? "plan-description-error"
                        : undefined
                    }
                    rows={4}
                    className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
                <FieldError
                  id={field.name}
                  errors={[form.formState.errors.description]}
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
            <Button
              type="submit"
              className="h-11"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "در حال ساخت" : "ساخت برنامه"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkoutPlanDialog;
