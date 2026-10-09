import { useState } from "react";
import { Share, Platform } from "react-native";
import * as Linking from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  Screen,
  Copy,
  Surface,
  Button,
  Field,
  LoadingState,
  ErrorState,
} from "../src/ui/components";
import {
  SignInGate,
  FeatureError,
  ConfirmAction,
  useOwner,
  BackButton,
} from "../src/ui/feature-components";
import { featureRequest } from "../src/features/api";
import { useI18n } from "../src/i18n";
const shares = z.array(
  z.object({
    id: z.string(),
    created_at: z.string(),
    expires_at: z.string().nullable(),
    revoked_at: z.string().nullable(),
  }),
);
export default function PlanShare() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useI18n();
  const owner = useOwner();
  const [now] = useState(() => Date.now());
  const [url, setUrl] = useState("");
  const [shareError, setShareError] = useState(false);
  const query = useQuery({
    queryKey: ["plan-shares", owner, id],
    queryFn: async () =>
      shares.parse(await featureRequest(`/api/workout-plans/${id}/shares`)),
    enabled: !!owner && !!id,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async (shareId?: string) => {
      if (shareId) {
        await featureRequest(`/api/workout-plans/${id}/shares/${shareId}`, {
          method: "DELETE",
        });
        setUrl("");
      } else {
        const data = z.object({ token: z.string() }).parse(
          await featureRequest(`/api/workout-plans/${id}/shares`, {
            method: "POST",
            body: { expires_in_days: 7 },
          }),
        );
        setUrl(
          Platform.OS === "web"
            ? `${window.location.origin}/shared-plan?token=${encodeURIComponent(data.token)}`
            : Linking.createURL("/shared-plan", {
                queryParams: { token: data.token },
              }),
        );
      }
    },
    onSuccess: () => {
      void query.refetch();
    },
  });
  return (
    <Screen>
      <Copy variant="title">{t("اشتراک روتین")}</Copy>
      {owner ? (
        <>
          <Copy>
            {t(
              "یک نسخه ثابت برای هفت روز منتشر می‌شود. فقط حرکت‌های عمومی قابل اشتراک هستند.",
            )}
          </Copy>
          <Button
            label={t("ساخت پیوند اشتراک")}
            loading={mutation.isPending}
            onPress={() => mutation.mutate(undefined)}
          />
          {url && (
            <Surface style={{ gap: 12 }}>
              <Field
                label={t("پیوند اشتراک")}
                value={url}
                editable={false}
                inputDirection="ltr"
              />
              <Button
                label={t("ارسال پیوند")}
                secondary
                onPress={() => {
                  setShareError(false);
                  void Share.share({ message: url }).catch(() =>
                    setShareError(true),
                  );
                }}
              />
              {shareError && (
                <Copy accessibilityRole="alert">
                  {t("پیوند را کپی و ارسال کنید.")}
                </Copy>
              )}
            </Surface>
          )}
          {mutation.isError && <FeatureError error={mutation.error} />}
          <Copy variant="title">{t("پیوندهای منتشرشده")}</Copy>
          {query.isPending ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState
              retry={() => {
                void query.refetch();
              }}
            />
          ) : query.data.length === 0 ? (
            <Copy>{t("پیوندی وجود ندارد.")}</Copy>
          ) : (
            query.data.map((s) => (
              <Surface key={s.id} style={{ gap: 12 }}>
                <Copy>
                  {new Date(s.created_at).toLocaleDateString(
                    language === "fa" ? "fa-IR" : "en-US",
                  )}
                </Copy>
                <Copy>
                  {t(
                    s.revoked_at
                      ? "لغوشده"
                      : s.expires_at && Date.parse(s.expires_at) < now
                        ? "منقضی‌شده"
                        : "فعال",
                  )}
                </Copy>
                {!s.revoked_at && (
                  <ConfirmAction
                    label={t("لغو پیوند")}
                    description={t(
                      "دسترسی جدید از این پیوند متوقف شود؟ نسخه‌های قبلی حفظ می‌شوند.",
                    )}
                    pending={mutation.isPending}
                    onConfirm={() => mutation.mutate(s.id)}
                  />
                )}
              </Surface>
            ))
          )}
        </>
      ) : (
        <SignInGate />
      )}
      <BackButton />
    </Screen>
  );
}
