export type SendRegistrationOtpPayload = {
  email: string;
  password: string;
};

export type VerifyRegistrationOtpPayload = {
  otp: string;
};
