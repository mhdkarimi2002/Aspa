import { useState } from "react";
import { useForm } from "react-hook-form";
import { registerFormSchema, type RegisterFormSchemaType } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLoginUser, useRegisterUser } from "../api/auth-mutation";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { LoginUserPayload } from "../api/auth-type";

export function useRegister() {
  const [formStep, setFormStep] = useState<number>(1);
  const registerMutation = useRegisterUser();
  const loginMutation = useLoginUser();
  const router = useRouter();
  const pathname = usePathname();

  const form = useForm<RegisterFormSchemaType>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(registerFormSchema),
  });

  function onRegisterUser(data: RegisterFormSchemaType) {
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

  function onLoginUser(data: LoginUserPayload) {
    const isValid = registerFormSchema.safeParse(data);
    if (isValid.success) {
      loginMutation.mutate(data, {
        onSuccess: () => {
          toast.success("با موفقیت وارد شدید");
          router.push("/");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    }
  }

  function onSubmitForm() {
    if (pathname === "/login") {
      onLoginUser(form.getValues());
    } else {
      onRegisterUser(form.getValues());
    }
  }

  return {
    form,
    formStep,
    setFormStep,
    onRegisterUser,
    onLoginUser,
    onSubmitForm,
  };
}
