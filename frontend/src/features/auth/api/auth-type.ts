export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type RegisterOtpRequestPayload = {
  phone_number: string;
  birthdate: string;
  gender: Gender;
};

export type LoginOtpRequestPayload = {
  phone_number: string;
};

export type OtpRequestResponse = {
  message: string;
  expires_in: number;
  dev_code?: string | null;
};

export type OtpVerifyPayload = {
  phone_number: string;
  code: string;
};

export type AuthUser = {
  id: string;
  phone_number: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};
