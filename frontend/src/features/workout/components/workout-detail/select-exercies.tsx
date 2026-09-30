"use client";

import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/theme.store";
import { useSelectExercies } from "../../hooks/use-select-exercies";
import ExercisePicker from "./exercise-picker";
import MusclePicker from "./muscle-picker";

const copy = {
  fa: { empty: "هنوز حرکتی انتخاب نشده", continue: "ادامه" },
  en: { empty: "No exercise selected yet", continue: "Continue" },
} as const;

const SelectExercies = ({
  onContinue,
}: {
  onContinue: (name: string) => void;
}) => {
  const view = useSelectExercies(onContinue);
  const texts = copy[useThemeStore((state) => state.language)];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <MusclePicker panel={view.muscles} onSelect={view.selectMuscle} />
      <ExercisePicker panel={view.exercises} onSelect={view.selectExercise} />
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border pt-4">
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {view.pickedName ?? texts.empty}
        </p>
        <Button
          type="button"
          className="h-11 shrink-0"
          disabled={!view.canContinue}
          onClick={view.onContinue}
        >
          {texts.continue}
        </Button>
      </div>
    </div>
  );
};

export default SelectExercies;
