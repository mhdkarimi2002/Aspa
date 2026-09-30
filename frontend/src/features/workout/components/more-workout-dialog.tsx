"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { WorkoutPlanDay } from "../api/workout-types";
import { useMoreWorkoutDay } from "../hooks/use-more-workout-day";

const MoreWorkoutDayDialog = ({
  planId,
  day,
}: {
  planId: string;
  day: WorkoutPlanDay;
}) => {
  const {
    open,
    view,
    setView,
    form,
    onOpenChange,
    openEdit,
    onSubmit,
    onDelete,
    updating,
    deleting,
  } = useMoreWorkoutDay(planId, day);
  const nameId = `edit-day-name-${day.id}`;
  const positionId = `edit-day-position-${day.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button
          type="button"
          variant="ghost"
          className="size-5"
          aria-label={`گزینه‌های ${day.name}`}
        >
          <MoreVertical className="size-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="bg-card">
        {view === "menu" ? (
          <>
            <DialogHeader>
              <DialogTitle>{day.name}</DialogTitle>
              <DialogDescription>
                نام روز را عوض کن یا این روز را حذف کن.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 justify-start"
                onClick={openEdit}
              >
                <Pencil className="size-4" aria-hidden="true" />
                ویرایش
              </Button>
            </div>
            <div className="border-t border-border pt-4">
              <Button
                type="button"
                variant="destructive"
                className="h-11 w-full justify-start"
                onClick={() => setView("delete")}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                حذف روز
              </Button>
            </div>
          </>
        ) : null}

        {view === "edit" ? (
          <>
            <DialogHeader>
              <DialogTitle>ویرایش روز</DialogTitle>
              <DialogDescription>
                نام و موقعیت این روز را عوض کن.
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
                    <Label htmlFor={nameId}>نام روز</Label>
                    <Input
                      id={nameId}
                      {...field}
                      autoComplete="off"
                      className="h-11"
                    />
                    <FieldError
                      id={field.name}
                      errors={[formState.errors.name]}
                    />
                  </Field>
                )}
              />
              <Controller
                name="position"
                control={form.control}
                render={({ field, formState }) => (
                  <Field className="flex flex-col gap-2">
                    <Label htmlFor={positionId}>موقعیت روز</Label>
                    <Input
                      id={positionId}
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
                      aria-invalid={
                        formState.errors.position ? true : undefined
                      }
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
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  onClick={() => setView("menu")}
                >
                  بازگشت
                </Button>
                <Button type="submit" className="h-11" disabled={updating}>
                  {updating ? "در حال ذخیره" : "ذخیره"}
                </Button>
              </div>
            </form>
          </>
        ) : null}

        {view === "delete" ? (
          <>
            <DialogHeader>
              <DialogTitle>حذف روز</DialogTitle>
              <DialogDescription>
                «{day.name}» و حرکت‌هایش از برنامه برداشته می‌شود.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => setView("menu")}
              >
                انصراف
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-11"
                disabled={deleting}
                onClick={onDelete}
              >
                {deleting ? "در حال حذف" : "حذف"}
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default MoreWorkoutDayDialog;
