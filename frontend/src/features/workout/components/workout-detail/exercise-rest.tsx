"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import type { AddExercieseSchema } from "../../schema";
import QuantityField from "./quantity-field";

const ExerciseRest = ({
  onBack,
}: {
  onBack: () => void;
}) => {
  const { control, formState } = useFormContext<AddExercieseSchema>();
  const notesError = formState.errors.notes;

  return (
    <div className="flex flex-col gap-5">
      <QuantityField
        name="rest_seconds"
        label="استراحت (ثانیه)"
        hint="۹۰ یعنی یک دقیقه و نیم."
        min={0}
        step={15}
        autoFocus
      />
      <QuantityField
        name="position"
        label="ترتیب در روز"
        hint="صفر این حرکت را اول لیست می‌گذارد."
        min={0}
      />
      <Controller
        name="notes"
        control={control}
        render={({ field }) => (
          <Field>
            <Label htmlFor="exercise-notes">یادداشت</Label>
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
              اختیاری. مثلاً تمپو یا نکتهٔ اجرا.
            </p>
            <FieldError id="exercise-notes-error" errors={[notesError]} />
          </Field>
        )}
      />
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button type="button" variant="outline" className="h-11" onClick={onBack}>
          بازگشت
        </Button>
        <Button type="submit" className="h-11" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "در حال افزودن" : "افزودن حرکت"}
        </Button>
      </div>
    </div>
  );
};

export default ExerciseRest;
