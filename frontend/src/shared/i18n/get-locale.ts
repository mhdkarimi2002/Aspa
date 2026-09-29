import { cookies } from "next/headers";

export type Locale = "fa" | "en";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("locale")?.value;
  return value === "en" ? "en" : "fa";
}
