import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { registerUser } from "./auth-repository";

export function useRegisterUser() {
  return useMutation({
    mutationFn: registerUser,
  });
}
