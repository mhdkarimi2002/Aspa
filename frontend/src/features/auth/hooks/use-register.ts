import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  registerFormSchema,
  registrationOtpFormSchema,
  RegistrationOtpFormSchemaType,
  type RegisterFormSchemaType,
} from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterUser } from "../api/auth-mutation";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export function useRegister() {
  const [formStep, setFormStep] = useState<number>(1);
  const registerMutation = useRegisterUser();
  const router = useRouter();

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

    if (result.success) {
      registerMutation.mutate(data, {
        onSuccess: () => {
          toast.success("با موفقیت ثبت نام کردید");
          router.push("/login");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    }
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
