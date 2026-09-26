"use client";
import Link from "next/link";
import { useRegister } from "@/features/hooks/use-register";
import RegistrationForm from "./registration-form";
import RegistrationOtpForm from "./registrationOtpForm";

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
  const { form, formStep, onRegisterUser } = useRegister();
  return (
    <section className="flex flex-col gap-8 rounded-xl border border-border bg-card  p-6 w-full">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl leading-tight font-semibold">{title}</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      </header>

      {formStep === 1 ? (
        <RegistrationForm form={form} onRegisterUser={onRegisterUser} />
      ) : (
        <RegistrationOtpForm />
      )}
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
