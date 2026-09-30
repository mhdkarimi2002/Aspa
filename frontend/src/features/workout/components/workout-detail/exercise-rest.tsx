"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { useThemeStore } from "@/stores/theme.store";
import type { AddExercieseSchema } from "../../schema";
import QuantityField from "./quantity-field";

const copy = {
  fa: {
    rest: "استراحت (ثانیه)",
    restHint: "۹۰ یعنی یک دقیقه و نیم.",
    order: "ترتیب در روز",
    orderHint: "صفر این حرکت را اول لیست می‌گذارد.",
    notes: "یادداشت",
    notesHint: "اختیاری. مثلاً تمپو یا نکتهٔ اجرا.",
    back: "بازگشت",
    adding: "در حال افزودن",
    add: "افزودن حرکت",
  },
  en: {
    rest: "Rest (seconds)",
    restHint: "90 is one and a half minutes.",
    order: "Order in the day",
    orderHint: "Zero puts this exercise first.",
    notes: "Note",
    notesHint: "Optional. For example tempo or a coaching cue.",
    back: "Back",
    adding: "Adding",
    add: "Add exercise",
  },
} as const;

const ExerciseRest = ({
  onBack,
}: {
  onBack: () => void;
}) => {
  const { control, formState } = useFormContext<AddExercieseSchema>();
  const notesError = formState.errors.notes;
  const texts = copy[useThemeStore((state) => state.language)];

  return (
    <div className="flex flex-col gap-5">
      <QuantityField
        name="rest_seconds"
        label={texts.rest}
        hint={texts.restHint}
        min={0}
        step={15}
        autoFocus
      />
      <QuantityField
        name="position"
        label={texts.order}
        hint={texts.orderHint}
        min={0}
      />
      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <Field>
            <Label htmlFor="exercise-notes">{texts.notes}</Label>
            <textarea
              id="exercise-notes"
              name={field.name}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              rows={3}
              aria-invalid={notesError ? true : undefined}
              aria-describedby={
                notesError ? "exercise-notes-error" : "exercise-notes-hint"
              }
              className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
            />
            <p id="exercise-notes-hint" className="text-sm text-muted-foreground">
              {texts.notesHint}
            </p>
            <FieldError id="exercise-notes-error" errors={[notesError]} />
          </Field>
        )}
      />
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" className="h-11" onClick={onBack}>
          {texts.back}
        </Button>
        <Button type="submit" className="h-11" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? texts.adding : texts.add}
        </Button>
      </div>
    </div>
  );
};

export default ExerciseRest;
