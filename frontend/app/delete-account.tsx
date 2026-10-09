import { useState } from "react";
import { Redirect, router, useIsFocused } from "expo-router";
import { Screen, Surface, Copy, Field, Button } from "../src/ui/components";
import { useI18n } from "../src/i18n";
import { usePalette } from "../src/ui/theme";
import { useSession } from "../src/auth/session";
import { deleteAccount, errorKey } from "../src/auth/service";
export default function DeleteAccount() {
  const { t } = useI18n();
  const c = usePalette();
  const focused = useIsFocused();
  const status = useSession((s) => s.status);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (status === "guest" && focused && !pending)
    return <Redirect href="/login" />;
  return (
    <Screen>
      <Copy variant="title">{t("حذف حساب")}</Copy>
      <Surface style={{ gap: 16 }}>
        <Copy style={{ color: c.danger }}>
          {t("حساب و تمام اطلاعات متعلق به آن برای همیشه حذف می‌شوند.")}
        </Copy>
        <Copy>{t("برای تأیید، DELETE را وارد کنید.")}</Copy>
        <Field
          label={t("تأیید حذف حساب")}
          value={confirmation}
          onChangeText={setConfirmation}
          autoCapitalize="characters"
          editable={!pending}
          inputDirection="ltr"
        />
        {error && (
          <Copy accessibilityRole="alert" style={{ color: c.danger }}>
            {t(error)}
          </Copy>
        )}
        <Button
          label={t("حذف دائمی حساب")}
          disabled={confirmation !== "DELETE"}
          loading={pending}
          onPress={() => {
            setPending(true);
            setError("");
            void deleteAccount()
              .then(() => router.replace("/"))
              .catch((e) => setError(errorKey(e)))
              .finally(() => setPending(false));
          }}
        />
        <Button
          label={t("انصراف")}
          secondary
          disabled={pending}
          onPress={() => router.replace("/account")}
        />
      </Surface>
    </Screen>
  );
}
