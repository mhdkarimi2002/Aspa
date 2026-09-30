"use client";

import { Minus, Plus } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddExercieseSchema } from "../../schema";

const QuantityField = ({
  name,
  label,
  hint,
  min,
  step = 1,
  autoFocus = false,
}: {
  name: "sets" | "min_reps" | "max_reps" | "rest_seconds" | "position";
  label: string;
  hint?: string;
  min: number;
  step?: number;
  autoFocus?: boolean;
}) => {
  const { control, formState } = useFormContext<AddExercieseSchema>();
  const error = formState.errors[name];
  const describedBy = [hint ? `${name}-hint` : null, error ? `${name}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = Number(field.value);

        function change(next: number) {
          field.onChange(next);
          field.onBlur();
        }

        return (
          <Field>
            <Label htmlFor={name}>{label}</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="size-11"
                aria-label={`کم کردن ${label}`}
                onClick={() => change(Math.max(min, value - step))}
              >
                <Minus className="size-4" aria-hidden="true" />
              </Button>
              <Input
                id={name}
                name={field.name}
                type="number"
                inputMode="numeric"
                dir="ltr"
                min={min}
                step={step}
                autoFocus={autoFocus}
                value={Number.isNaN(value) ? "" : value}
                onChange={(event) => {
                  const raw = event.target.value;
                  field.onChange(raw === "" ? min : Number(raw));
                }}
                onBlur={field.onBlur}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy || undefined}
                className="h-11 text-center tabular-nums"
              />
              <Button
                type="button"
                variant="outline"
                className="size-11"
                aria-label={`زیاد کردن ${label}`}
                onClick={() => change(value + step)}
              >
                <Plus className="size-4" aria-hidden="true" />
              </Button>
            </div>
            {hint ? (
              <p id={`${name}-hint`} className="text-sm text-muted-foreground">
                {hint}
              </p>
            ) : null}
            <FieldError id={`${name}-error`} errors={[error]} />
          </Field>
        );
      }}
    />
  );
};

export default QuantityField;
