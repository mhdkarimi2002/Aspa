import { useMutation } from "@tanstack/react-query";
import {
  requestLoginOtp,
  requestRegistrationOtp,
  verifyLoginOtp,
  verifyRegistrationOtp,
} from "./auth-repository";

export function useRequestRegistrationOtp() {
  return useMutation({ mutationFn: requestRegistrationOtp });
}

export function useVerifyRegistrationOtp() {
  return useMutation({ mutationFn: verifyRegistrationOtp });
}

export function useRequestLoginOtp() {
  return useMutation({ mutationFn: requestLoginOtp });
}

export function useVerifyLoginOtp() {
  return useMutation({ mutationFn: verifyLoginOtp });
}
