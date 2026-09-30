"use client";

import { Button } from "@/components/ui/button";
import { useSelectExercies } from "../../hooks/use-select-exercies";
import ExercisePicker from "./exercise-picker";
import MusclePicker from "./muscle-picker";

const SelectExercies = ({ onContinue }: { onContinue: () => void }) => {
  const view = useSelectExercies(onContinue);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <MusclePicker panel={view.muscles} onSelect={view.selectMuscle} />
      <ExercisePicker panel={view.exercises} onSelect={view.selectExercise} />
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border pt-4">
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          {view.pickedName ?? "هنوز حرکتی انتخاب نشده"}
        </p>
        <Button
          type="button"
          className="h-11 shrink-0"
          disabled={!view.canContinue}
          onClick={view.onContinue}
        >
          ادامه
        </Button>
      </div>
    </div>
  );
};

export default SelectExercies;
