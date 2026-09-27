import { EmailAuthForm } from "@/features/auth/components/email-auth-form";

export default function RegisterPage() {
  return (
    <div className="max-w-sm mx-auto flex justify-center items-center px-0">
      <EmailAuthForm
        title="شروع"
        description="با شماره موبایل حساب می‌سازید. رمز عبور لازم نیست."
        alternateHref="/login"
        alternateLabel="حساب دارید؟ وارد شوید"
      />
    </div>
  );
}
