import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Controller, UseFormReturn } from "react-hook-form";
import { RegistrationOtpFormSchemaType } from "../schema";

const slotClassName = "size-14 text-base rounded-xl!";

interface Props {
  form: UseFormReturn<RegistrationOtpFormSchemaType>;
  onSubmit: (data: RegistrationOtpFormSchemaType) => void;
}

const RegistrationOtpForm = ({ form, onSubmit }: Props) => {
  return (
    <form
      className="flex w-full flex-col gap-6"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="otp" className="text-sm font-medium">
          کد تأیید
        </label>
        <Controller
          control={form.control}
          name="otp"
          render={({ field }) => (
            <InputOTP
              id="otp"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              containerClassName="justify-between flex-row-reverse items-center"
            >
              <InputOTPGroup className="flex-row-reverse gap-3 items-center">
                <InputOTPSlot index={0} className={slotClassName} />
                <InputOTPSlot index={1} className={slotClassName} />
                <InputOTPSlot index={2} className={slotClassName} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="flex-row-reverse gap-3 items-center">
                <InputOTPSlot index={3} className={slotClassName} />
                <InputOTPSlot index={4} className={slotClassName} />
                <InputOTPSlot index={5} className={slotClassName} />
              </InputOTPGroup>
            </InputOTP>
          )}
        />
        <p className="text-xs leading-normal text-muted-foreground">
          کد شش‌رقمی را وارد کنید.
        </p>
      </div>

      <Button type="submit" size="lg" className="h-11 w-full">
        تأیید
      </Button>
    </form>
  );
};

export default RegistrationOtpForm;
