import { EmailAuthForm } from "@/features/auth/components/phone-auth-form";

export default function LoginPage() {
  return (
    <EmailAuthForm
      title="ورود"
      description="کد یک‌بارمصرف به شماره موبایل شما می‌آید."
      alternateHref="/register"
      alternateLabel="حساب ندارید؟ شروع کنید"
    />
  );
}
