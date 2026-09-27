export type RegisterUserPayload = {
  email: string;
  password: string;
};

export type RegisterUserResponse = {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    phone_number: string | null;
    email: string;
    is_active: boolean;
    created_at: string;
  };
};

export type LoginUserPayload = RegisterUserPayload;
export type LoginUserResponse = RegisterUserResponse;
