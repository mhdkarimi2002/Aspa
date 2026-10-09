import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Copy, Surface, Button, Field, Row } from "./components";
import { useI18n } from "../i18n";
import { useSession } from "../auth/session";
import { usePalette } from "./theme";
import { ApiError } from "../api/client";
import { errorKey } from "../auth/service";
export function FeatureError({ error }: { error: unknown }) {
  const { t } = useI18n();
  const c = usePalette();
  return (
    <Copy accessibilityRole="alert" style={{ color: c.danger }}>
      {t(
        error instanceof ApiError && error.status === 409
          ? "اطلاعات تغییر کرده یا عملیات فعلاً ممکن نیست. دوباره بارگذاری کنید."
          : errorKey(error),
      )}
    </Copy>
  );
}
export function SignInGate() {
  const { t } = useI18n();
  return (
    <Surface style={{ gap: 16 }}>
      <Copy>{t("برای استفاده از این بخش وارد حساب شوید.")}</Copy>
      <Button
        label={t("ورود یا ثبت‌نام")}
        onPress={() => router.push("/login")}
      />
    </Surface>
  );
}
export function useOwner() {
  return useSession((s) =>
    s.status === "authenticated" ? s.user?.id : undefined,
  );
}
export function BackButton({
  href = "/plans",
}: {
  href?: "/" | "/plans" | "/exercises" | "/profile" | "/history";
}) {
  const { t } = useI18n();
  return (
    <Button
      label={t("بازگشت")}
      secondary
      onPress={() => router.replace(href)}
    />
  );
}
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (id: string) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  return (
    <View style={{ gap: 12 }}>
      <Button
        label={`${label}: ${options.find((x) => x.id === value)?.name ?? t("همه")}`}
        secondary
        selected={open}
        onPress={() => setOpen(!open)}
      />
      {open && (
        <Surface style={{ gap: 12 }}>
          <Field
            label={t("جستجو در گزینه‌ها")}
            value={search}
            onChangeText={setSearch}
          />
          {options
            .filter((x) =>
              x.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
            )
            .map((option) => (
              <Button
                key={option.id}
                label={option.name}
                selected={option.id === value}
                secondary={option.id !== value}
                onPress={() => {
                  onChange(option.id);
                  setOpen(false);
                  setSearch("");
                }}
              />
            ))}
        </Surface>
      )}
    </View>
  );
}
export function ConfirmAction({
  label,
  description,
  onConfirm,
  pending = false,
}: {
  label: string;
  description: string;
  onConfirm: () => void;
  pending?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return open ? (
    <Surface style={{ gap: 12 }}>
      <Copy>{description}</Copy>
      <Button
        label={t("تأیید")}
        loading={pending}
        onPress={() => {
          onConfirm();
          setOpen(false);
        }}
      />
      <Button
        label={t("انصراف")}
        secondary
        disabled={pending}
        onPress={() => setOpen(false)}
      />
    </Surface>
  ) : (
    <Button
      label={label}
      secondary
      disabled={pending}
      onPress={() => setOpen(true)}
    />
  );
}
export function PageButtons({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (n: number) => void;
}) {
  const { t, language } = useI18n();
  return (
    <View style={{ gap: 12 }}>
      <Copy style={{ textAlign: "center" }}>
        {t("صفحه {page} از {pages}", {
          page: new Intl.NumberFormat(language).format(page),
          pages: new Intl.NumberFormat(language).format(Math.max(pages, 1)),
        })}
      </Copy>
      <Row>
        <View style={{ flex: 1 }}>
          <Button
            label={t("قبلی")}
            secondary
            disabled={page <= 1}
            onPress={() => onChange(page - 1)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={t("بعدی")}
            secondary
            disabled={page >= pages}
            onPress={() => onChange(page + 1)}
          />
        </View>
      </Row>
    </View>
  );
}
export function duration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
