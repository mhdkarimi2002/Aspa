"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Controller, UseFormReturn } from "react-hook-form";
import { RegisterFormSchemaType } from "../schema";

interface Props {
  form: UseFormReturn<RegisterFormSchemaType>;
  onSubmitForm: () => void;
}

const RegistrationForm = ({ form, onSubmitForm }: Props) => {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmitForm)}
      className="flex flex-col gap-6 w-full "
    >
      <div className="flex flex-col gap-2">
        <Field>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <>
                <label htmlFor={field.name} className="text-sm font-medium">
                  ایمیل
                </label>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  dir="ltr"
                  aria-invalid={fieldState.invalid || undefined}
                  className={cn(
                    "text-end",
                    fieldState.error && "border-destructive",
                  )}
                />
                {fieldState.error ? (
                  <FieldError>{fieldState.error.message}</FieldError>
                ) : (
                  <p className="text-xs leading-normal text-muted-foreground">
                    مثال: example@example.com
                  </p>
                )}
              </>
            )}
          />
        </Field>

        <Field>
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <>
                <Label htmlFor={field.name} className="text-sm font-medium">
                  رمز عبور
                </Label>
                <Input
                  {...field}
                  type="password"
                  autoComplete="new-password"
                  dir="ltr"
                  aria-invalid={fieldState.invalid || undefined}
                  className={cn(
                    "text-end",
                    fieldState.error && "border-destructive",
                  )}
                />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </>
            )}
          />
        </Field>
      </div>
      <Button type="submit" size="lg" className="h-11 w-full">
        دریافت کد
      </Button>
    </form>
  );
};

export default RegistrationForm;
