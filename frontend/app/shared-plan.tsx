import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Screen,
  Copy,
  Surface,
  Button,
  LoadingState,
  ErrorState,
} from "../src/ui/components";
import {
  SignInGate,
  useOwner,
  FeatureError,
  BackButton,
} from "../src/ui/feature-components";
import { featureRequest } from "../src/features/api";
import { planItemSchema, planSchema } from "../src/features/contracts";
import { useI18n } from "../src/i18n";
const preview = z.object({
  name: z.string(),
  description: z.string().nullable(),
  exercises: z.array(planItemSchema),
});
export default function SharedPlan() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useI18n();
  const owner = useOwner();
  const cache = useQueryClient();
  const path = "/api/workout-plans/shared/" + encodeURIComponent(token ?? "");
  const query = useQuery({
    queryKey: ["shared-plan", owner, token],
    queryFn: async () => preview.parse(await featureRequest(path)),
    enabled: !!owner && !!token,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async () =>
      planSchema.parse(
        await featureRequest(path + "/import", { method: "POST" }),
      ),
    onSuccess: (plan) => {
      void cache.invalidateQueries({ queryKey: ["plans", owner] });
      router.replace({ pathname: "/plan", params: { id: plan.id } });
    },
  });
  return (
    <Screen>
      <Copy variant="title">{t("برنامه اشتراکی")}</Copy>
      {!owner ? (
        <>
          <Copy>{t("پس از ورود، این پیوند را دوباره باز کنید.")}</Copy>
          <SignInGate />
        </>
      ) : !token ? (
        <Copy>{t("پیوند نامعتبر است.")}</Copy>
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
          <Surface style={{ gap: 12 }}>
            <Copy variant="title">{query.data.name}</Copy>
            <Copy>{query.data.description}</Copy>
          </Surface>
          {query.data.exercises.map((e) => (
            <Surface key={e.id}>
              <Copy>
                {e.exercise.name_fa} · {e.sets} {t("ست")}
              </Copy>
              {e.target_sets.map((s, i) => (
                <Copy key={i} variant="small">
                  {i + 1}. {s.target_reps} {t("تکرار")} ·{" "}
                  {s.target_weight_kg ?? "—"} {t("کیلوگرم")}
                </Copy>
              ))}
            </Surface>
          ))}
          <Copy>{t("یک نسخه مستقل به برنامه‌های شما اضافه می‌شود.")}</Copy>
          {mutation.isError && <FeatureError error={mutation.error} />}
          <Button
            label={t("افزودن به برنامه‌های من")}
            loading={mutation.isPending}
            onPress={() => mutation.mutate()}
          />
        </>
      )}
      <BackButton />
    </Screen>
  );
}
