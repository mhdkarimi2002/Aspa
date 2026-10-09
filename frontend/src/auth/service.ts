import { deleteWorkoutStorage } from "../features/workouts/storage";
import { z } from "zod";
import { apiUrl, cookieSession } from "../api/runtime";
import { request, ApiError } from "../api/client";
import { session, useSession } from "./session";
import { authSchema, userSchema, type User } from "./schemas";
export type Mode = "access";
export async function requestOtp(
  mode: Mode,
  body: { phone_number: string; birthdate?: string; gender?: string },
) {
  return z
    .object({
      expires_in: z.number().positive(),
      dev_code: z.string().optional(),
    })
    .parse(
      await request(apiUrl, "/api/auth/otp/request", undefined, {
        method: "POST",
        body,
      }),
    );
}
export async function verifyOtp(
  mode: Mode,
  phone_number: string,
  code: string,
) {
  await session.accept(
    authSchema.parse(
      await request(apiUrl, "/api/auth/otp/verify", undefined, {
        method: "POST",
        body: { phone_number, code },
        cookieSession,
      }),
    ),
  );
}
export async function getProfile(signal?: AbortSignal) {
  return userSchema.parse(
    await session.authenticated("/api/users/me", {}, signal),
  );
}
export async function updateProfile(
  body: Partial<
    Pick<
      User,
      | "username"
      | "email"
      | "birthdate"
      | "gender"
      | "avatar"
      | "name"
      | "province"
      | "bio"
      | "profile_link"
    >
  >,
) {
  return userSchema.parse(
    await session.authenticated("/api/users/me", { method: "PATCH", body }),
  );
}
export function errorKey(error: unknown) {
  if (!(error instanceof ApiError))
    return "اتصال برقرار نشد. دوباره تلاش کنید.";
  if (error.status === 429)
    return "درخواست‌های زیادی ارسال شده است. کمی بعد دوباره تلاش کنید.";
  if (error.status === 409)
    return "این شماره، نام کاربری یا ایمیل قبلاً ثبت شده است.";
  if (error.status === 401) return "کد یا نشست نامعتبر یا منقضی شده است.";
  if (error.status === 403) return "حساب شما فعال نیست.";
  if (error.status === 404) return "حساب پیدا نشد. ابتدا ثبت‌نام کنید.";
  if (error.status === 422) return "اطلاعات واردشده را بررسی کنید.";
  return "سرویس در دسترس نیست. دوباره تلاش کنید.";
}

export async function deleteAccount() {
  const owner = useSession.getState().user?.id;
  await session.authenticated("/api/users/me", { method: "DELETE" });
  await session.clear();
  if (owner) await deleteWorkoutStorage(owner);
}

export async function uploadProfilePhoto(image: string, ownerId?: string) {
  return z.object({ avatar: z.string() }).parse(
    await session.authenticated("/api/users/me/avatar", {
      method: "POST",
      body: { image },
      ownerId,
    }),
  );
}
