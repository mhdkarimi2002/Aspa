import { api } from "@/shared/api/client";
import { SendRegistrationOtpPayload } from "./auth-type";
import { API_ENDPOINTS } from "@/shared/api/endpoints";

export async function registerUser(
  payload: SendRegistrationOtpPayload,
): Promise<any> {
  return api(API_ENDPOINTS.auth.register, {
    method: "POST",
    body: payload,
  });
}
