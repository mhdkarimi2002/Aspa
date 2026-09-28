import { api } from "@/shared/api/client";
import { API_ENDPOINTS } from "@/shared/api/endpoints";
import {
  AuthResponse,
  LoginOtpRequestPayload,
  OtpRequestResponse,
  OtpVerifyPayload,
  RegisterOtpRequestPayload,
} from "./auth-type";

export function requestRegistrationOtp(payload: RegisterOtpRequestPayload) {
  return api<OtpRequestResponse>(API_ENDPOINTS.auth.registerOtpRequest, {
    method: "POST",
    body: payload,
  });
}

export function verifyRegistrationOtp(payload: OtpVerifyPayload) {
  return api<AuthResponse>(API_ENDPOINTS.auth.registerOtpVerify, {
    method: "POST",
    body: payload,
  });
}

export function requestLoginOtp(payload: LoginOtpRequestPayload) {
  return api<OtpRequestResponse>(API_ENDPOINTS.auth.loginOtpRequest, {
    method: "POST",
    body: payload,
  });
}

export function verifyLoginOtp(payload: OtpVerifyPayload) {
  return api<AuthResponse>(API_ENDPOINTS.auth.loginOtpVerify, {
    method: "POST",
    body: payload,
  });
}
