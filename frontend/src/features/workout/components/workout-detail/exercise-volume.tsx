"use client";

import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/theme.store";
import QuantityField from "./quantity-field";

const copy = {
  fa: {
    exercise: "حرکت",
    sets: "ست",
    minReps: "حداقل تکرار",
    maxReps: "حداکثر تکرار",
    back: "بازگشت",
    continue: "ادامه",
  },
  en: {
    exercise: "Exercise",
    sets: "Sets",
    minReps: "Min reps",
    maxReps: "Max reps",
    back: "Back",
    continue: "Continue",
  },
} as const;

const ExerciseVolume = ({
  exerciseName,
  onBack,
  onContinue,
}: {
  exerciseName: string;
  onBack: () => void;
  onContinue: () => void;
}) => {
  const texts = copy[useThemeStore((state) => state.language)];

  return (
  <div className="flex flex-col gap-5">
    <p className="text-sm text-muted-foreground">
      {texts.exercise}:{" "}
      <span className="font-semibold text-foreground">{exerciseName}</span>
    </p>
    <QuantityField name="sets" label={texts.sets} min={1} autoFocus />
    <QuantityField name="min_reps" label={texts.minReps} min={1} />
    <QuantityField name="max_reps" label={texts.maxReps} min={1} />
    <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
      <Button type="button" variant="outline" className="h-11" onClick={onBack}>
        {texts.back}
      </Button>
      <Button type="button" className="h-11" onClick={onContinue}>
        {texts.continue}
      </Button>
    </div>
  </div>
  );
};

export default ExerciseVolume;
