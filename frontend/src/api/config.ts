import { z } from "zod";
export function parseConfig(values: { apiUrl?: string; environment?: string }) {
  const environment = z
    .enum(["local", "staging", "production"])
    .parse(values.environment ?? "local");
  const apiUrl = z
    .url()
    .refine(
      (value) => ["http:", "https:"].includes(new URL(value).protocol),
      "HTTP URL required",
    )
    .parse(
      values.apiUrl ??
        (environment === "local" ? "http://localhost:8000" : undefined),
    );
  if (environment !== "local" && !apiUrl.startsWith("https://"))
    throw new Error("Hosted environments require HTTPS");
  return { environment, apiUrl: apiUrl.replace(/\/$/, "") };
}
export const config = parseConfig({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  environment: process.env.EXPO_PUBLIC_APP_ENV,
});
