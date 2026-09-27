export type User = {
  id: string;
  phone_number: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
};

export enum UserRoles {
  Admin = "Admin",
  User = "User",
  Quest = "Quest",
}
