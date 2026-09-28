"use client";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Controller, UseFormReturn } from "react-hook-form";
import { RegistrationOtpFormSchemaType } from "../schema";

const slotClassName =
  "aspect-square h-auto w-full min-w-0 rounded-lg! border text-sm size-auto! sm:rounded-xl! sm:text-base";

interface Props {
  form: UseFormReturn<RegistrationOtpFormSchemaType>;
  pending: boolean;
  devCode: string | null;
  onSubmit: (data: RegistrationOtpFormSchemaType) => void;
}

const RegistrationOtpForm = ({ form, pending, devCode, onSubmit }: Props) => {
  return (
    <form
      className="flex w-full flex-col gap-6 "
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="otp" className="text-sm font-medium">
          کد تأیید
        </label>
        <Controller
          control={form.control}
          name="otp"
          render={({ field, fieldState }) => (
            <>
              <InputOTP
                id="otp"
                maxLength={6}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputMode="numeric"
                autoComplete="one-time-code"
                dir="ltr"
                aria-invalid={fieldState.invalid || undefined}
                containerClassName="w-full min-w-0"
              >
                <InputOTPGroup className="grid w-full min-w-0 grid-cols-6 gap-1.5 [direction:ltr] sm:gap-2">
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={slotClassName}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {fieldState.error ? (
                <FieldError>{fieldState.error.message}</FieldError>
              ) : (
                <p className="text-xs leading-normal text-muted-foreground">
                  {devCode
                    ? `کد محیط محلی: ${devCode}`
                    : "کد ارسال‌شده را وارد کنید."}
                </p>
              )}
            </>
          )}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={pending}
      >
        {pending ? "در حال بررسی..." : "تأیید"}
      </Button>
    </form>
  );
};

export default RegistrationOtpForm;
