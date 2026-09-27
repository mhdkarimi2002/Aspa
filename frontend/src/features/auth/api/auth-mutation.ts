import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { loginUser, registerUser } from "./auth-repository";

export function useRegisterUser() {
  return useMutation({
    mutationFn: registerUser,
  });
}

export function useLoginUser() {
  return useMutation({
    mutationFn: loginUser,
  });
}
