import { toGregorian, toJalaali, isValidJalaaliDate } from "jalaali-js";
import { z } from "zod";
import { digits, birthdateSchema } from "./schemas";
import type { Language } from "../i18n/messages";
function iso(year: number, month: number, day: number) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
export function displayBirthdate(gregorian: string | null, language: Language) {
  if (!gregorian || language === "en") return gregorian ?? "";
  const [year, month, day] = gregorian.split("-").map(Number);
  const j = toJalaali(year, month, day);
  return iso(j.jy, j.jm, j.jd);
}
export function birthdateInputSchema(language: Language) {
  return z
    .string()
    .transform(digits)
    .transform((value) => value.replaceAll("/", "-"))
    .transform((value, ctx) => {
      try {
        if (language === "en") return birthdateSchema.parse(value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error();
        const [y, m, d] = value.split("-").map(Number);
        if (!isValidJalaaliDate(y, m, d)) throw new Error();
        const g = toGregorian(y, m, d);
        return birthdateSchema.parse(iso(g.gy, g.gm, g.gd));
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "تاریخ تولد معتبر و غیرآینده وارد کنید.",
        });
        return z.NEVER;
      }
    });
}
