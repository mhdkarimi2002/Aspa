import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  registerFormSchema,
  registrationOtpFormSchema,
  RegistrationOtpFormSchemaType,
  type RegisterFormSchemaType,
} from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";

export function useRegister() {
  const [formStep, setFormStep] = useState<number>(1);

  const form = useForm<RegisterFormSchemaType>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(registerFormSchema),
  });

  function onSendOtp(data: RegisterFormSchemaType) {
    const result = registerFormSchema.safeParse(data);
    console.log(data);

    setFormStep(2);

    return {
      success: true,
      data: result.data,
    };
  }

  const otpForm = useForm<RegistrationOtpFormSchemaType>({
    defaultValues: {
      otp: "",
    },
    resolver: zodResolver(registrationOtpFormSchema),
  });

  const onVerifyOtp = (data: RegistrationOtpFormSchemaType) => {
    const result = registrationOtpFormSchema.safeParse(data);
    console.log(data);
  };

  return {
    form,
    formStep,
    setFormStep,
    onRegisterUser: onSendOtp,
    otpForm,
    onVerifyOtp,
  };
}
