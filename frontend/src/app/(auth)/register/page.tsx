import { EmailAuthForm } from "@/features/auth/components/email-auth-form";

export default function RegisterPage() {
  return (
    <EmailAuthForm
      title="شروع"
      description="با شماره موبایل حساب می‌سازید. رمز عبور لازم نیست."
      alternateHref="/login"
      alternateLabel="حساب دارید؟ وارد شوید"
    />
  );
}
