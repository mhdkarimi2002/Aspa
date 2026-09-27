import { api } from "@/shared/api/client";
import {
  LoginUserPayload,
  LoginUserResponse,
  RegisterUserPayload,
  RegisterUserResponse,
} from "./auth-type";
import { API_ENDPOINTS } from "@/shared/api/endpoints";

export async function registerUser(
  payload: RegisterUserPayload,
): Promise<RegisterUserResponse> {
  return api<RegisterUserResponse>(API_ENDPOINTS.auth.register, {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(
  payload: LoginUserPayload,
): Promise<LoginUserResponse> {
  return api<LoginUserResponse>(API_ENDPOINTS.auth.login, {
    method: "POST",
    body: payload,
  });
}
