"use client";
import Link from "next/link";
import { useRegister } from "@/features/auth/hooks/use-authentication";
import LoginForm from "./login-form";
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
  const {
    mode,
    step,
    devCode,
    registerForm,
    loginForm,
    otpForm,
    requestPending,
    otpPending,
    onRequestRegister,
    onRequestLogin,
    onVerifyOtp,
  } = useRegister();

  return (
    <section className="flex w-full flex-col gap-8 rounded-xl border border-border bg-card p-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl leading-tight font-semibold">{title}</h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      </header>

      {step === "otp" ? (
        <RegistrationOtpForm
          form={otpForm}
          pending={otpPending}
          devCode={devCode}
          onSubmit={onVerifyOtp}
        />
      ) : mode === "login" ? (
        <LoginForm
          form={loginForm}
          pending={requestPending}
          onSubmit={onRequestLogin}
        />
      ) : (
        <RegistrationForm
          form={registerForm}
          pending={requestPending}
          onSubmit={onRequestRegister}
        />
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
