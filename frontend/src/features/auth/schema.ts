import { object, string, type infer as ZodInfer } from "zod";
export const registerFormSchema = object({
  email: string()
    .email()
    .min(1, { message: "ایمیل الزامی است" })
    .superRefine((arg, ctx) => {
      const value = arg as string;
      if (!value.includes("@")) {
        ctx.addIssue({
          code: "custom",
          message: "ایمیل باید شامل @ باشد",
        });
      }

      if (!value.includes(".com")) {
        ctx.addIssue({
          code: "custom",
          message: "ایمیل باید شامل .com باشد",
        });
      }
    }),

  password: string().min(8, { message: "رمز عبور باید حداقل 8 کاراکتر باشد" }),
});

export type RegisterFormSchemaType = ZodInfer<typeof registerFormSchema>;
