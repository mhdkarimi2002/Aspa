import { useCallback, useEffect, useState } from "react";
import { router, Redirect, useIsFocused } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Screen, Surface, Copy, Button, Field } from "../src/ui/components";
import { useI18n } from "../src/i18n";
import { usePalette } from "../src/ui/theme";
import { phoneSchema, codeSchema, digits } from "../src/auth/schemas";
import { requestOtp, verifyOtp, errorKey } from "../src/auth/service";
import { useSession } from "../src/auth/session";
import { ApiError } from "../src/api/client";
import { config } from "../src/api/config";
const schema = z.object({ phone: phoneSchema });
export default function Login() {
  const { t, language } = useI18n();
  const c = usePalette();
  const status = useSession((s) => s.status);
  const focused = useIsFocused();
  const [pending, setPending] = useState(false);
  const [challenge, setChallenge] = useState<{
    phone: string;
    expires: number;
    dev?: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [resendUntil, setResendUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { phone: "" },
  });
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const fail = useCallback((e: unknown) => {
    setError(errorKey(e));
    if (e instanceof ApiError && e.status === 429)
      setBlockedUntil(Date.now() + Math.max(e.retryAfter, 60) * 1000);
  }, []);
  const send = useCallback(
    async ({ phone }: { phone: string }) => {
      setPending(true);
      setError("");
      try {
        const result = await requestOtp("access", { phone_number: phone });
        setChallenge({
          phone,
          expires: Date.now() + result.expires_in * 1000,
          dev: result.dev_code,
        });
        setResendUntil(Date.now() + 60000);
        setCode("");
      } catch (e) {
        fail(e);
      } finally {
        setPending(false);
      }
    },
    [fail],
  );
  const verify = useCallback(async () => {
    if (!challenge) return;
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setPending(true);
    setError("");
    try {
      await verifyOtp("access", challenge.phone, parsed.data);
      router.replace("/profile");
    } catch (e) {
      fail(e);
    } finally {
      setPending(false);
    }
  }, [challenge, code, fail]);
  if (status === "authenticated" && focused)
    return <Redirect href="/profile" />;
  const cooldown = Math.max(
    0,
    Math.ceil((Math.max(blockedUntil, resendUntil) - now) / 1000),
  );
  return (
    <Screen>
      <Copy variant="display">{t("به آسپا خوش آمدید")}</Copy>
      <Copy>
        {t("با شماره موبایل وارد شوید؛ اگر حساب ندارید، خودکار ساخته می‌شود.")}
      </Copy>
      <Surface style={{ gap: 20 }}>
        {!challenge ? (
          <>
            <Controller
              control={control}
              name="phone"
              render={({ field, fieldState }) => (
                <Field
                  label={t("شماره موبایل")}
                  placeholder="09123456789"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  editable={!pending}
                  error={fieldState.error?.message}
                  inputDirection="ltr"
                />
              )}
            />
            <Button
              label={t("ارسال کد تأیید")}
              loading={pending}
              disabled={now < blockedUntil}
              onPress={handleSubmit(send)}
            />
          </>
        ) : (
          <>
            <Copy>
              {t("کد به شماره {phone} ارسال شد.", {
                phone: `\u2068${challenge.phone}\u2069`,
              })}
            </Copy>
            <Field
              label={t("کد تأیید")}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={5}
              value={code}
              onChangeText={(v) =>
                setCode(
                  digits(v)
                    .replace(/[^0-9]/g, "")
                    .slice(0, 5),
                )
              }
              editable={!pending}
              inputDirection="ltr"
            />
            <Copy variant="small">
              {t(
                now >= challenge.expires
                  ? "کد منقضی شده است. کد جدید درخواست کنید."
                  : "کد تا {seconds} ثانیه دیگر معتبر است.",
                {
                  seconds: new Intl.NumberFormat(language).format(
                    Math.max(0, Math.ceil((challenge.expires - now) / 1000)),
                  ),
                },
              )}
            </Copy>
            {config.environment === "local" && challenge.dev && (
              <Copy variant="small">
                {t("کد محیط توسعه: {code}", { code: challenge.dev })}
              </Copy>
            )}
            <Button
              label={t("تأیید و ادامه")}
              loading={pending}
              disabled={
                code.length !== 5 ||
                now < blockedUntil ||
                now >= challenge.expires
              }
              onPress={() => {
                void verify();
              }}
            />
            <Button
              label={t("ارسال دوباره کد")}
              secondary
              disabled={pending || cooldown > 0}
              onPress={() => {
                void send({ phone: challenge.phone });
              }}
            />
            <Button
              label={t("تغییر شماره")}
              secondary
              disabled={pending}
              onPress={() => {
                setChallenge(null);
                setCode("");
                setError("");
              }}
            />
          </>
        )}
        {cooldown > 0 && (
          <Copy variant="small">
            {t("درخواست بعدی تا {seconds} ثانیه دیگر.", {
              seconds: new Intl.NumberFormat(language).format(cooldown),
            })}
          </Copy>
        )}
        {error && (
          <Copy accessibilityRole="alert" style={{ color: c.danger }}>
            {t(error)}
          </Copy>
        )}
      </Surface>
      <Button
        label={t("بازگشت به خانه")}
        secondary
        disabled={pending}
        onPress={() => router.replace("/")}
      />
    </Screen>
  );
}
