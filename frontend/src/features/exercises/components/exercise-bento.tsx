"use client";

import { useState } from "react";
import { Dumbbell, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Exercise } from "../api/exercies-type";
import { useThemeStore } from "@/stores/theme.store";

const difficultyLabel: Record<string, string> = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
};

const bentoSpans = [
  "lg:col-span-2 lg:row-span-2",
  "lg:col-span-2 lg:row-span-2",
  "lg:col-span-2",
  "",
  "",
  "lg:col-span-2",
  "",
  "",
];

const labelFor = (difficulty: string) =>
  difficultyLabel[difficulty] ?? difficulty;

const ExerciseBento = ({ exercises }: { exercises: Exercise[] }) => {
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [open, setOpen] = useState(false);
  const language = useThemeStore((state) => state.language);

  const copy = {
    fa: {
      equipment: "تجهیزات",
      primary_muscles: "عضله اصلی",
      secondary_muscles: "عضله کمکی",
    },
    en: {
      equipment: "Equipment",
      primary_muscles: "Primary Muscles",
      secondary_muscles: "Secondary Muscles",
    },
  };

  return (
    <>
      <ul className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {exercises.map((exercise, index) => {
          const span = bentoSpans[index % bentoSpans.length];
          const large = span.includes("row-span-2");

          return (
            <li key={exercise.id} className={`self-start ${span}`}>
              <article
                className={`flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card ${large ? "min-h-44 lg:min-h-72" : "min-h-44"}`}
              >
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => {
                    setSelected(exercise);
                    setOpen(true);
                  }}
                  className="flex w-full flex-1 cursor-pointer flex-col gap-4 p-4 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring"
                >
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Dumbbell className="size-5" aria-hidden="true" />
                  </span>
                  <span className="mt-auto flex flex-col gap-1">
                    <span className="text-base font-semibold">
                      {exercise.name_fa}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      <span dir="ltr">{exercise.name_en}</span>
                    </span>
                  </span>
                  <span className="w-fit rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">
                    {labelFor(exercise.difficulty)}
                  </span>
                </button>
              </article>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        onOpenChangeComplete={(next) => {
          if (!next) setSelected(null);
        }}
      >
        <DialogContent showCloseButton={false} className="bg-card">
          {selected ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Dumbbell className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <DialogTitle className="text-base font-semibold">
                      {selected.name_fa}
                    </DialogTitle>
                    <DialogDescription>
                      <span dir="ltr">{selected.name_en}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <DialogClose
                aria-label="بستن"
                className="absolute top-4 inset-e-4 flex size-11 cursor-pointer items-center justify-center rounded-xl outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring"
              >
                <X className="size-5" aria-hidden="true" />
              </DialogClose>
              <span className="w-fit rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">
                {labelFor(selected.difficulty)}
              </span>
              {selected.description_fa ? (
                <p className="text-sm leading-relaxed">
                  {language === "fa"
                    ? selected.description_fa
                    : selected.description_en}
                </p>
              ) : null}
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">
                    {copy[language].equipment}
                  </dt>
                  <dd className="font-medium">
                    {language === "fa"
                      ? (selected.equipment?.name_fa ?? "بدون وسیله")
                      : (selected.equipment?.name_en ?? "No equipment")}
                  </dd>
                </div>
                <div
                  dir={language === "fa" ? "rtl" : "ltr"}
                  className="flex flex-col gap-1"
                >
                  <dt className="text-muted-foreground">
                    {copy[language].primary_muscles}
                  </dt>
                  <dd className="font-medium">
                    {language === "fa"
                      ? selected.primary_muscles
                          .map((muscle) => muscle.name_fa)
                          .join("، ")
                      : selected.primary_muscles
                          .map((muscle) => muscle.name_en)
                          .join("، ")}
                  </dd>
                </div>
                {selected.secondary_muscles.length > 0 ? (
                  <div
                    dir={language === "fa" ? "rtl" : "ltr"}
                    className="col-span-2 flex flex-col gap-1"
                  >
                    <dt className="text-muted-foreground">
                      {language === "fa"
                        ? copy[language].secondary_muscles
                        : copy[language].secondary_muscles}
                    </dt>
                    <dd className="font-medium flex gap-x-1">
                      {selected.secondary_muscles.map((muscle) => (
                        <p key={muscle.id}>
                          {language === "fa" ? muscle.name_fa : muscle.name_en}
                        </p>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExerciseBento;
