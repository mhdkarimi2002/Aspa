"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Controller, UseFormReturn } from "react-hook-form";
import type { LoginFormSchemaType } from "../schema";
import PhoneInput from "./phone-input";

interface LoginProps {
  form: UseFormReturn<LoginFormSchemaType>;
  pending: boolean;
  onSubmit: (data: LoginFormSchemaType) => void;
}

const LoginForm = ({ form, pending, onSubmit }: LoginProps) => {
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
};

export default LoginForm;
