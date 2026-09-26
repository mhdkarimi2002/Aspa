"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError } from "@/components/ui/field";
import { Controller } from "react-hook-form";
import { useRegister } from "@/features/hooks/use-register";
import { cn } from "cn";

type PhoneAuthFormProps = {
  title: string;
  description: string;
  alternateHref: string;
  alternateLabel: string;
};

export function EmailAuthForm({
  title,
  description,
  alternateHref,
  alternateLabel,
}: PhoneAuthFormProps) {
  const { form, formStep, setFormStep, onRegisterUser } = useRegister();
  return (
    <section className="flex flex-col gap-8 rounded-xl border border-border bg-card  p-6 w-full">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl leading-tight font-semibold">{title}</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      </header>
      <form
        onSubmit={form.handleSubmit(onRegisterUser)}
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
                  <label htmlFor={field.name} className="text-sm font-medium">
                    رمز عبور
                  </label>
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
      <p className="text-sm text-muted-foreground">
        <Link
          href={alternateHref}
          className="text-foreground underline-offset-4 hover:underline"
        >
          {alternateLabel}
        </Link>
      </p>
    </section>
  );
}
