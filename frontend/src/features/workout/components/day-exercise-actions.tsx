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
import { useThemeStore } from "@/stores/theme.store";

const copy = {
  fa: {
    set: "ست",
    rep: "تکرار",
    rest: "استراحت",
    position: "ترتیب",
    note: "یادداشت",
    delete: "حذف",
    cancel: "انصراف",
    deleteConfirm: "حذف حرکت",
    deleteConfirmDescription: "«{name}» از این روز برداشته می‌شود.",
    deleting: "در حال حذف",
    emptyNote: "یادداشتی ثبت نشده.",
  },
  en: {
    set: "set",
    rep: "rep",
    rest: "rest",
    position: "position",
    note: "note",
    delete: "delete",
    cancel: "cancel",
    deleteConfirm: "deleteConfirm",
    deleteConfirmDescription: "deleteConfirmDescription",
    deleting: "deleting",
    emptyNote: "no note",
  },
};

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
  const language = useThemeStore((state) => state.language);
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

  const texts = copy[language];

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
        aria-label={`${texts.delete} ${name}`}
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription dir="ltr" className="text-start">
              {language === "fa"
                ? exercise.exercise.name_fa
                : exercise.exercise.name_en}
            </DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-3">
            <DetailItem
              label={texts.set}
              value={exercise.sets.toLocaleString("fa-IR")}
            />
            <DetailItem
              label={texts.rep}
              value={formatReps(exercise.min_reps, exercise.max_reps)}
            />
            <DetailItem
              label={texts.rest}
              value={`${exercise.rest_seconds.toLocaleString("fa-IR")} ثانیه`}
            />
            <DetailItem
              label={texts.position}
              value={exercise.position.toLocaleString("fa-IR")}
            />
          </dl>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{texts.note}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {exercise.notes?.trim() ? exercise.notes : texts.emptyNote}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{texts.deleteConfirm}</DialogTitle>
            <DialogDescription>
              {texts.deleteConfirmDescription.replace("{name}", name)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => setDeleteOpen(false)}
            >
              {texts.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11"
              disabled={removeExercise.isPending}
              onClick={() => void confirmDelete()}
            >
              {removeExercise.isPending ? texts.deleting : texts.delete}
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
