"use client";

import { useState } from "react";
import { Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkoutPlanDayExercise } from "../api/workout-types";
import { useDeleteExercise } from "../api/workout-mutations";

const DayExerciseActions = ({
  planId,
  dayId,
  exercise,
}: {
  planId: string;
  dayId: string;
  exercise: WorkoutPlanDayExercise;
}) => {
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const removeExercise = useDeleteExercise();
  const name = exercise.exercise.name_fa;

  async function confirmDelete() {
    await removeExercise.mutateAsync({
      planId,
      dayId,
      itemId: exercise.id,
    });
    setDeleteOpen(false);
  }

  return (
    <div className="flex shrink-0 items-center gap-x-0.5">
      <Button
        type="button"
        variant="ghost"
        className="size-8"
        aria-label={`جزئیات ${name}`}
        onClick={() => setDetailOpen(true)}
      >
        <Info className="size-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="size-8 text-destructive"
        aria-label={`حذف ${name}`}
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription dir="ltr" className="text-start">
              {exercise.exercise.name_en}
            </DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-3">
            <DetailItem
              label="ست"
              value={exercise.sets.toLocaleString("fa-IR")}
            />
            <DetailItem
              label="تکرار"
              value={formatReps(exercise.min_reps, exercise.max_reps)}
            />
            <DetailItem
              label="استراحت"
              value={`${exercise.rest_seconds.toLocaleString("fa-IR")} ثانیه`}
            />
            <DetailItem
              label="ترتیب"
              value={exercise.position.toLocaleString("fa-IR")}
            />
          </dl>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">یادداشت</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {exercise.notes?.trim() ? exercise.notes : "یادداشتی ثبت نشده."}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>حذف حرکت</DialogTitle>
            <DialogDescription>
              «{name}» از این روز برداشته می‌شود.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => setDeleteOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11"
              disabled={removeExercise.isPending}
              onClick={() => void confirmDelete()}
            >
              {removeExercise.isPending ? "در حال حذف" : "حذف"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-border bg-card px-3 py-3">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm font-semibold">{value}</dd>
  </div>
);

function formatReps(min: number, max: number) {
  if (min === max) return min.toLocaleString("fa-IR");
  return `${min.toLocaleString("fa-IR")}–${max.toLocaleString("fa-IR")}`;
}

export default DayExerciseActions;
