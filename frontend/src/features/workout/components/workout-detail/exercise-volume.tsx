"use client";

import { Button } from "@/components/ui/button";
import QuantityField from "./quantity-field";

const ExerciseVolume = ({
  exerciseName,
  onBack,
  onContinue,
}: {
  exerciseName: string;
  onBack: () => void;
  onContinue: () => void;
}) => (
  <div className="flex flex-col gap-5">
    <p className="text-sm text-muted-foreground">
      حرکت:{" "}
      <span className="font-semibold text-foreground">{exerciseName}</span>
    </p>
    <QuantityField name="sets" label="ست" min={1} autoFocus />
    <QuantityField name="min_reps" label="حداقل تکرار" min={1} />
    <QuantityField name="max_reps" label="حداکثر تکرار" min={1} />
    <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
      <Button type="button" variant="outline" className="h-11" onClick={onBack}>
        بازگشت
      </Button>
      <Button type="button" className="h-11" onClick={onContinue}>
        ادامه
      </Button>
    </div>
  </div>
);

export default ExerciseVolume;
