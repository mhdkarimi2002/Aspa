import { z } from "zod";
export function digits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) =>
    String(
      "۰۱۲۳۴۵۶۷۸۹".includes(digit)
        ? "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)
        : "٠١٢٣٤٥٦٧٨٩".indexOf(digit),
    ),
  );
}
export function normalizePhone(value: string) {
  let phone = digits(value).replace(/[\s()-]/g, "");
  if (phone.startsWith("0098")) phone = "+98" + phone.slice(4);
  else if (phone.startsWith("98")) phone = "+" + phone;
  else if (phone.startsWith("09")) phone = "+98" + phone.slice(1);
  return phone;
}
export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .pipe(z.string().regex(/^\+989\d{9}$/, "شماره موبایل معتبر وارد کنید."));
export const birthdateSchema = z
  .string()
  .transform(digits)
  .refine((value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + "T00:00:00Z");
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return (
      !Number.isNaN(d.getTime()) &&
      d.toISOString().slice(0, 10) === value &&
      value <= today
    );
  }, "تاریخ میلادی معتبر و غیرآینده وارد کنید.");
export const genderSchema = z.enum([
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);
export const codeSchema = z
  .string()
  .transform(digits)
  .pipe(z.string().regex(/^\d{5}$/, "کد باید پنج رقم باشد."));
export const userSchema = z.object({
  id: z.string(),
  phone_number: z.string().nullable(),
  username: z.string().nullable(),
  name: z.string().nullable().optional().default(null),
  province: z.string().nullable().optional().default(null),
  bio: z.string().nullable().optional().default(null),
  profile_link: z.string().nullable().optional().default(null),
  email: z.string().nullable(),
  birthdate: z.string().nullable(),
  birthdate_jalali: z.string().nullable(),
  gender: genderSchema.nullable(),
  avatar: z.string().nullable(),
  account_level: z.enum(["free", "pro"]),
  is_active: z.boolean(),
});
export const authSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(32),
  refresh_expires_in: z.number().positive(),
  user: userSchema,
});
export type User = z.infer<typeof userSchema>;
export type Auth = z.infer<typeof authSchema>;
export const profileSchema = z.object({
  province: z
    .string()
    .trim()
    .max(100, "استان حداکثر ۱۰۰ حرف دارد.")
    .optional()
    .default(""),
  name: z.string().trim().max(100, "نام حداکثر ۱۰۰ حرف دارد."),
  bio: z.string().trim().max(500, "درباره من حداکثر ۵۰۰ حرف دارد."),
  profile_link: z
    .string()
    .trim()
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return (
          value.length <= 500 &&
          /^https?:\/\//.test(value) &&
          ["http:", "https:"].includes(url.protocol) &&
          !!url.hostname &&
          !url.username &&
          !url.password
        );
      } catch {
        return false;
      }
    }, "رابط باید یک آدرس HTTP یا HTTPS معتبر باشد."),
  avatar: z
    .string()
    .trim()
    .refine(
      (value) =>
        !value ||
        /^\/api\/users\/avatars\/[0-9a-f-]{36}$/.test(value) ||
        (value.length <= 500 &&
          z.url().safeParse(value).success &&
          value.startsWith("https://")),
      "رابط عکس باید یک آدرس HTTPS معتبر باشد.",
    ),
  username: z
    .string()
    .trim()
    .refine(
      (s) => !s || (s.length >= 3 && s.length <= 50),
      "نام کاربری باید بین ۳ تا ۵۰ حرف باشد.",
    ),
  email: z
    .string()
    .trim()
    .refine(
      (s) => !s || z.email().safeParse(s).success,
      "ایمیل معتبر وارد کنید.",
    ),
  birthdate: birthdateSchema,
  gender: genderSchema,
});
