import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { setClientAccessToken } from "@/shared/utils/access-token";
import { useUserStore } from "@/stores/user-store";
import {
  useRequestLoginOtp,
  useRequestRegistrationOtp,
  useVerifyLoginOtp,
  useVerifyRegistrationOtp,
} from "../api/auth-mutation";
import type { AuthResponse } from "../api/auth-type";
import {
  loginFormSchema,
  registerFormSchema,
  registrationOtpFormSchema,
  type LoginFormSchemaType,
  type RegisterFormSchemaType,
  type RegistrationOtpFormSchemaType,
} from "../schema";

export function useRegister() {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const requestRegistration = useRequestRegistrationOtp();
  const verifyRegistration = useVerifyRegistrationOtp();
  const requestLogin = useRequestLoginOtp();
  const verifyLogin = useVerifyLoginOtp();
  const router = useRouter();
  const pathname = usePathname();
  const mode = pathname === "/login" ? "login" : "register";
  const setUser = useUserStore((state) => state.setUser);
  const setIsAuthenticated = useUserStore((state) => state.setIsAuthenticated);

  const registerForm = useForm<RegisterFormSchemaType>({
    defaultValues: {
      phone_number: "",
      birthdate: "",
      gender: "male",
    },
    resolver: zodResolver(registerFormSchema),
  });
  const loginForm = useForm<LoginFormSchemaType>({
    defaultValues: { phone_number: "" },
    resolver: zodResolver(loginFormSchema),
  });
  const otpForm = useForm<RegistrationOtpFormSchemaType>({
    defaultValues: { otp: "" },
    resolver: zodResolver(registrationOtpFormSchema),
  });

  function rememberOtp(phone: string, code: string | null | undefined) {
    setPhoneNumber(phone);
    setDevCode(code ?? null);
    setStep("otp");
  }

  function signIn(data: AuthResponse) {
    setClientAccessToken(data.access_token);
    setUser({
      id: data.user.id,
      phone_number: data.user.phone_number,
      email: data.user.email,
      is_active: data.user.is_active,
      created_at: data.user.created_at,
    });
    setIsAuthenticated(true);
    router.push("/");
  }

  function onRequestRegister(data: RegisterFormSchemaType) {
    requestRegistration.mutate(data, {
      onSuccess: (response) => {
        rememberOtp(data.phone_number, response.dev_code);
        toast.success("کد تأیید ارسال شد");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  function onRequestLogin(data: LoginFormSchemaType) {
    requestLogin.mutate(data, {
      onSuccess: (response) => {
        rememberOtp(data.phone_number, response.dev_code);
        toast.success("کد تأیید ارسال شد");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  function onVerifyOtp(data: RegistrationOtpFormSchemaType) {
    const payload = { phone_number: phoneNumber, code: data.otp };
    const mutation = mode === "login" ? verifyLogin : verifyRegistration;
    mutation.mutate(payload, {
      onSuccess: (response) => {
        toast.success(
          mode === "login" ? "با موفقیت وارد شدید" : "حساب ساخته شد",
        );
        signIn(response);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  const requestPending =
    requestRegistration.isPending || requestLogin.isPending;
  const otpPending = verifyRegistration.isPending || verifyLogin.isPending;

  return {
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
  };
}
