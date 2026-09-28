"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Controller, UseFormReturn } from "react-hook-form";
import {
  LoginFormSchemaType,
  RegisterFormSchemaType,
} from "../schema";

const genders = [
  { value: "male", label: "مرد" },
  { value: "female", label: "زن" },
  { value: "other", label: "سایر" },
  { value: "prefer_not_to_say", label: "ترجیح می‌دهم نگویم" },
] as const;

interface RegisterProps {
  form: UseFormReturn<RegisterFormSchemaType>;
  pending: boolean;
  onSubmit: (data: RegisterFormSchemaType) => void;
}

const RegistrationForm = ({ form, pending, onSubmit }: RegisterProps) => {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-6"
    >
      <Field>
        <Controller
          name="phone_number"
          control={form.control}
          render={({ field, fieldState }) => (
            <PhoneInput field={field} fieldState={fieldState} />
          )}
        />
      </Field>
      <Field>
        <Controller
          name="birthdate"
          control={form.control}
          render={({ field, fieldState }) => (
            <>
              <label htmlFor={field.name} className="text-sm font-medium">
                تاریخ تولد
              </label>
              <Input
                {...field}
                id={field.name}
                type="date"
                autoComplete="bday"
                dir="ltr"
                aria-invalid={fieldState.invalid || undefined}
                className={cn("text-end", fieldState.error && "border-destructive")}
              />
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : null}
            </>
          )}
        />
      </Field>
      <Field>
        <Controller
          name="gender"
          control={form.control}
          render={({ field, fieldState }) => (
            <>
              <label htmlFor={field.name} className="text-sm font-medium">
                جنسیت
              </label>
              <Select
                name={field.name}
                value={field.value}
                items={genders}
                onValueChange={(value) => {
                  if (value) field.onChange(value);
                }}
              >
                <SelectTrigger
                  id={field.name}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid || undefined}
                  className={cn(
                    "h-11 w-full",
                    fieldState.error && "border-destructive",
                  )}
                >
                  <SelectValue className="text-start" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : null}
            </>
          )}
        />
      </Field>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "در حال ارسال..." : "دریافت کد"}
      </Button>
    </form>
  );
};

interface LoginProps {
  form: UseFormReturn<LoginFormSchemaType>;
  pending: boolean;
  onSubmit: (data: LoginFormSchemaType) => void;
}

export function LoginForm({ form, pending, onSubmit }: LoginProps) {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-6"
    >
      <Field>
        <Controller
          name="phone_number"
          control={form.control}
          render={({ field, fieldState }) => (
            <PhoneInput field={field} fieldState={fieldState} />
          )}
        />
      </Field>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "در حال ارسال..." : "دریافت کد"}
      </Button>
    </form>
  );
}

function PhoneInput({
  field,
  fieldState,
}: {
  field: {
    name: string;
    value: string;
    onChange: (value: string) => void;
    onBlur: () => void;
  };
  fieldState: { invalid: boolean; error?: { message?: string } };
}) {
  return (
    <>
      <label htmlFor={field.name} className="text-sm font-medium">
        شماره موبایل
      </label>
      <Input
        id={field.name}
        name={field.name}
        value={field.value}
        onBlur={field.onBlur}
        onChange={(event) => field.onChange(event.target.value)}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        dir="ltr"
        aria-invalid={fieldState.invalid || undefined}
        className={cn("text-end", fieldState.error && "border-destructive")}
      />
      {fieldState.error ? (
        <FieldError>{fieldState.error.message}</FieldError>
      ) : (
        <p className="text-xs leading-normal text-muted-foreground">
          مثال: 09123456789
        </p>
      )}
    </>
  );
}

export default RegistrationForm;
