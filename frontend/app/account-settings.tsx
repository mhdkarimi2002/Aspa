import { useState } from "react";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Screen, Copy, Surface, Field, Button } from "../src/ui/components";
import { ProfileHeader } from "../src/ui/profile-components";
import { SignInGate } from "../src/ui/feature-components";
import { useSession } from "../src/auth/session";
import { profileSchema } from "../src/auth/schemas";
import { updateProfile, errorKey } from "../src/auth/service";
import { useI18n } from "../src/i18n";
export default function AccountSettings() {
  const { t } = useI18n();
  const cache = useQueryClient();
  const user = useSession((s) => s.user);
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState("");
  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: (value) => {
      if (useSession.getState().user?.id !== value.id) return;
      useSession.getState().setUser(value);
      cache.setQueryData(["profile", value.id], value);
      router.replace("/settings");
    },
  });
  return (
    <Screen header={<ProfileHeader title="حساب" back="/settings" />}>
      {!user ? (
        <SignInGate />
      ) : (
        <>
          <Surface style={{ gap: 16 }}>
            <Copy style={{ writingDirection: "ltr" }}>{user.phone_number}</Copy>
            <Field
              label={t("نام کاربری")}
              value={username}
              onChangeText={setUsername}
              maxLength={50}
              autoCapitalize="none"
              editable={!save.isPending}
            />
            <Field
              label={t("ایمیل")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              inputDirection="ltr"
              editable={!save.isPending}
            />
            {!!error && <Copy accessibilityRole="alert">{t(error)}</Copy>}
            {save.isError && (
              <Copy accessibilityRole="alert">{t(errorKey(save.error))}</Copy>
            )}
            <Button
              label={t("ذخیره تغییرات")}
              loading={save.isPending}
              onPress={() => {
                const parsed = profileSchema
                  .pick({ username: true, email: true })
                  .safeParse({ username, email });
                if (!parsed.success) {
                  setError(parsed.error.issues[0].message);
                  return;
                }
                setError("");
                save.mutate({
                  username: parsed.data.username || null,
                  email: parsed.data.email || null,
                });
              }}
            />
          </Surface>
          <Button
            label={t("حذف حساب")}
            secondary
            disabled={save.isPending}
            onPress={() => router.push("/delete-account")}
          />
        </>
      )}
    </Screen>
  );
}
