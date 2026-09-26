import { useState } from "react";
import { useForm, type FieldErrors, type Resolver } from "react-hook-form";
import {
  registerFormSchema,
  type RegisterFormSchemaType,
} from "../auth/schema";

function zodResolver(
  schema: typeof registerFormSchema,
): Resolver<RegisterFormSchemaType> {
  return (values) => {
    const result = schema.safeParse(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: FieldErrors<RegisterFormSchemaType> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      if ((field === "email" || field === "password") && !errors[field]) {
        errors[field] = { type: issue.code, message: issue.message };
      }
    }

    return { values: {}, errors };
  };
}

export function useRegister() {
  const [formStep, setFormStep] = useState<number>(1);

  const form = useForm<RegisterFormSchemaType>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(registerFormSchema),
  });

  function onRegisterUser(data: RegisterFormSchemaType) {
    const result = registerFormSchema.safeParse(data);

    // if (!result.success) {
    //   return {
    //     error: result.error.issues[0].message,
    //   };
    // }

    console.log(data);

    return {
      success: true,
      data: result.data,
    };
  }

  return {
    form,
    formStep,
    setFormStep,
    onRegisterUser,
  };
}
