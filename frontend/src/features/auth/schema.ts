import { enum as zEnum, object, string, type infer as ZodInfer } from "zod";

function isIranianMobile(value: string) {
  const digits = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[\s()-]/g, "");
  return /^(\+98|0098|98|0)?9\d{9}$/.test(digits);
}

const phoneNumber = string()
  .min(1, { message: "شماره موبایل الزامی است" })
  .refine(isIranianMobile, { message: "شماره موبایل معتبر نیست" });

export const registerFormSchema = object({
  phone_number: phoneNumber,
  birthdate: string()
    .min(1, { message: "تاریخ تولد الزامی است" })
    .refine((value) => {
      const date = new Date(`${value}T00:00:00`);
      return !Number.isNaN(date.getTime()) && date <= new Date();
    }, "تاریخ تولد نمی‌تواند در آینده باشد"),
  gender: zEnum(["male", "female", "other", "prefer_not_to_say"], {
    error: "جنسیت را انتخاب کنید",
  }),
});

export type RegisterFormSchemaType = ZodInfer<typeof registerFormSchema>;

export const loginFormSchema = object({
  phone_number: phoneNumber,
});

export type LoginFormSchemaType = ZodInfer<typeof loginFormSchema>;

export const registrationOtpFormSchema = object({
  otp: string().regex(/^\d{5,6}$/, { message: "کد تأیید باید ۵ یا ۶ رقم باشد" }),
});

export type RegistrationOtpFormSchemaType = ZodInfer<
  typeof registrationOtpFormSchema
>;
