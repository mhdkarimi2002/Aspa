import { useState } from "react";
import { Image, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Screen,
  Surface,
  Copy,
  Button,
  LoadingState,
  ErrorState,
} from "../src/ui/components";
import {
  BackButton,
  useOwner,
  SignInGate,
  FeatureError,
} from "../src/ui/feature-components";
import { useI18n } from "../src/i18n";
import { getExercise, featureRequest } from "../src/features/api";
import { z } from "zod";
function Media({
  exerciseId,
  mediaId,
  asset,
  kind,
}: {
  exerciseId: string;
  mediaId?: string;
  asset?: "image" | "video";
  kind: "image" | "video";
}) {
  const { t } = useI18n();
  const owner = useOwner();
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["media", owner, exerciseId, mediaId, asset],
    queryFn: async ({ signal }) =>
      z
        .object({ url: z.url() })
        .parse(
          await featureRequest(
            asset
              ? `/api/exercises/${exerciseId}/assets/${asset}`
              : `/api/exercises/${exerciseId}/media/${mediaId}`,
            {},
            signal,
          ),
        ),
    enabled: open,
    staleTime: 240000,
    retry: false,
  });
  return (
    <Surface style={{ gap: 12 }}>
      <Button
        label={t(kind === "image" ? "نمایش تصویر" : "تماشای ویدیو")}
        secondary
        onPress={() => {
          setFailed(false);
          setOpen(true);
          void query.refetch();
        }}
      />
      {open &&
        (query.isPending ? (
          <LoadingState />
        ) : query.isError || failed ? (
          <ErrorState
            retry={() => {
              setFailed(false);
              void query.refetch();
            }}
          />
        ) : kind === "image" ? (
          <Image
            source={{ uri: query.data.url }}
            accessibilityLabel={t("تصویر راهنمای حرکت")}
            resizeMode="contain"
            style={{ width: "100%", height: 240, borderRadius: 16 }}
            onError={() => setFailed(true)}
          />
        ) : (
          <Button
            label={t("باز کردن ویدیو")}
            onPress={() => {
              void query
                .refetch()
                .then((result) => {
                  if (result.data) return Linking.openURL(result.data.url);
                  throw new Error("Media unavailable");
                })
                .catch(() => setFailed(true));
            }}
          />
        ))}
    </Surface>
  );
}
export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const owner = useOwner();
  const { t } = useI18n();
  const query = useQuery({
    queryKey: ["exercise", owner, id],
    queryFn: ({ signal }) => getExercise(id, signal),
    enabled: !!id,
    retry: false,
  });
  return (
    <Screen>
      <BackButton href="/exercises" />
      {!id ? (
        <FeatureError error={new Error("missing")} />
      ) : query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <>
          <Copy variant="display">{query.data.name_fa}</Copy>
          <Surface style={{ gap: 12 }}>
            <Copy>{t(query.data.difficulty)}</Copy>
            <Copy>
              {query.data.description_fa ?? t("توضیحی ثبت نشده است.")}
            </Copy>
            <Copy>
              {t("عضلات اصلی")}:{" "}
              {query.data.primary_muscles.map((x) => x.name_fa).join(" · ")}
            </Copy>
            <Copy>
              {t("عضلات کمکی")}:{" "}
              {query.data.secondary_muscles.map((x) => x.name_fa).join(" · ") ||
                t("ندارد")}
            </Copy>
            <Copy>
              {t("تجهیزات")}:{" "}
              {query.data.equipment?.name_fa ?? t("بدون تجهیزات")}
            </Copy>
          </Surface>
          <Copy variant="title">{t("راهنمای اجرا")}</Copy>
          {query.data.instruction_steps.length ? (
            query.data.instruction_steps.map((step, i) => (
              <Surface key={step.id}>
                <Copy>
                  {i + 1}. {step.text_fa}
                </Copy>
              </Surface>
            ))
          ) : (
            <Copy>{t("راهنمایی ثبت نشده است.")}</Copy>
          )}
          <Copy variant="title">{t("رسانه‌های حرکت")}</Copy>
          {owner && query.data.image_key && (
            <Media exerciseId={id} asset="image" kind="image" />
          )}
          {owner && query.data.video_key && (
            <Media exerciseId={id} asset="video" kind="video" />
          )}
          {query.data.media.length === 0 &&
          !query.data.image_key &&
          !query.data.video_key ? (
            <Copy>{t("رسانه‌ای ثبت نشده است.")}</Copy>
          ) : owner ? (
            query.data.media.map((item) => (
              <Media
                key={item.id}
                exerciseId={id}
                mediaId={item.id}
                kind={item.media_type === "gif" ? "image" : "video"}
              />
            ))
          ) : (
            <SignInGate />
          )}
          {owner && (
            <Button
              label={t("تاریخچه حرکت")}
              secondary
              onPress={() =>
                router.push({ pathname: "/history", params: { exercise: id } })
              }
            />
          )}
          <Copy variant="small">
            {t("متن کتابخانه توسط مربی به فارسی ثبت شده است.")}
          </Copy>
        </>
      )}
    </Screen>
  );
}
