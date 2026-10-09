import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Screen,
  Copy,
  Surface,
  Button,
  Field,
  Row,
  LoadingState,
  ErrorState,
} from "../src/ui/components";
import {
  BackButton,
  SignInGate,
  useOwner,
  FeatureError,
  ConfirmAction,
} from "../src/ui/feature-components";
import { getPlan, planWrite, featureRequest } from "../src/features/api";
import { planFormSchema, type Plan } from "../src/features/contracts";
import { useWorkouts } from "../src/features/workouts/provider";
import { useI18n } from "../src/i18n";
import { View } from "react-native";
function Editor({
  plan,
  initialEditing,
}: {
  plan: Plan;
  initialEditing: boolean;
}) {
  const { t } = useI18n();
  const owner = useOwner();
  const cache = useQueryClient();
  const workouts = useWorkouts();
  const [managing, setManaging] = useState(initialEditing);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description ?? "");
  const [localError, setLocalError] = useState<unknown>(null);
  const [starting, setStarting] = useState(false);
  const mutate = useMutation({
    mutationFn: async ({
      suffix = "",
      method = "POST",
      body,
    }: {
      suffix?: string;
      method: "POST" | "PATCH" | "PUT" | "DELETE";
      body?: unknown;
    }) => {
      if (method === "DELETE") {
        await featureRequest("/api/workout-plans/" + plan.id + suffix, {
          method,
        });
        return null;
      }
      return planWrite(plan.id, { method, body }, suffix);
    },
    onSuccess: (value) => {
      void cache.invalidateQueries({ queryKey: ["plans", owner] });
      if (value && value.id === plan.id)
        cache.setQueryData(["plan", owner, plan.id], value);
      else if (value)
        router.replace({ pathname: "/plan", params: { id: value.id } });
      else if (!mutate.variables?.suffix) router.replace("/plans");
      else void cache.invalidateQueries({ queryKey: ["plan", owner, plan.id] });
      setEditing(false);
    },
  });
  const active = workouts.entries.find(
    (x) => x.document.status === "in_progress",
  );
  const start = async () => {
    setStarting(true);
    setLocalError(null);
    try {
      if (active) {
        router.push({
          pathname: "/workout",
          params: { client: active.document.client_id },
        });
        return;
      }
      await workouts.engine?.restoreActive();
      const current = workouts.engine
        ?.getSnapshot()
        .entries.find((x) => x.document.status === "in_progress");
      const client =
        current?.document.client_id ?? (await workouts.engine?.create(plan));
      if (client) {
        void workouts.engine?.flush();
        router.push({ pathname: "/workout", params: { client } });
      }
    } catch (e) {
      setLocalError(e);
    } finally {
      setStarting(false);
    }
  };
  return (
    <>
      <Copy variant="display">{plan.name}</Copy>
      <Copy>
        {plan.is_archived
          ? t("بایگانی‌شده")
          : plan.is_active
            ? t("فعال")
            : t("آماده تمرین")}
      </Copy>
      {plan.description && <Copy>{plan.description}</Copy>}
      {mutate.isError && <FeatureError error={mutate.error} />}{" "}
      {!!localError && <FeatureError error={localError} />}
      {workouts.storageError && (
        <Copy accessibilityRole="alert">
          {t("ذخیره روی دستگاه ممکن نشد. فضای ذخیره‌سازی را بررسی کنید.")}
        </Copy>
      )}
      <Button
        label={t(active ? "ادامه تمرین" : "شروع تمرین")}
        loading={starting}
        disabled={
          !workouts.loaded ||
          workouts.storageError ||
          (!active && (plan.is_archived || !plan.exercises.length))
        }
        onPress={() => {
          void start();
        }}
      />
      <Button
        label={t(managing ? "پایان ویرایش روتین" : "ویرایش روتین")}
        secondary
        selected={managing}
        onPress={() => setManaging(!managing)}
      />
      {managing && !plan.is_archived && (
        <>
          <Button
            label={t("افزودن حرکت")}
            secondary
            disabled={mutate.isPending}
            onPress={() =>
              router.push({
                pathname: "/pick-exercises",
                params: { plan: plan.id },
              })
            }
          />
          <Button
            label={t(plan.is_active ? "غیرفعال کردن" : "فعال کردن")}
            secondary
            loading={mutate.isPending}
            onPress={() =>
              mutate.mutate({
                method: "POST",
                suffix: plan.is_active ? "/deactivate" : "/activate",
              })
            }
          />
        </>
      )}
      <Copy variant="title">{t("حرکت‌های روتین")}</Copy>
      {plan.exercises.length === 0 && (
        <Copy>{t("برای شروع تمرین، یک حرکت اضافه کنید.")}</Copy>
      )}
      {plan.exercises.map((item, index) => (
        <Surface key={item.id} style={{ gap: 12 }}>
          <Copy variant="title">
            {index + 1}. {item.exercise.name_fa}
          </Copy>
          <Copy>
            {item.sets} {t("ست")} · {item.min_reps}–{item.max_reps} {t("تکرار")}{" "}
            · {item.rest_seconds} {t("ثانیه استراحت")}
          </Copy>
          {item.target_sets.map((target, i) => (
            <Copy key={i} variant="small">
              {t("ست")} {i + 1}: {target.target_reps} {t("تکرار")} ·{" "}
              {target.target_weight_kg ?? "—"} {t("کیلوگرم")}
            </Copy>
          ))}
          {item.notes && <Copy>{item.notes}</Copy>}
          {managing && (
            <>
              <Button
                label={t("ویرایش حرکت و ست‌ها")}
                secondary
                disabled={mutate.isPending}
                onPress={() =>
                  router.push({
                    pathname: "/plan-exercise",
                    params: { plan: plan.id, item: item.id },
                  })
                }
              />
              <Row>
                {[-1, 1].map((step) => (
                  <View key={step} style={{ flex: 1 }}>
                    <Button
                      label={t(step === -1 ? "بالا" : "پایین")}
                      secondary
                      disabled={
                        mutate.isPending ||
                        index + step < 0 ||
                        index + step >= plan.exercises.length
                      }
                      onPress={() => {
                        const ids = plan.exercises.map((x) => x.id);
                        [ids[index], ids[index + step]] = [
                          ids[index + step],
                          ids[index],
                        ];
                        mutate.mutate({
                          method: "PUT",
                          suffix: "/exercises/order",
                          body: { exercise_ids: ids },
                        });
                      }}
                    />
                  </View>
                ))}
              </Row>
              <ConfirmAction
                label={t("حذف حرکت")}
                description={t("این حرکت از برنامه حذف شود؟")}
                pending={mutate.isPending}
                onConfirm={() =>
                  mutate.mutate({
                    method: "DELETE",
                    suffix: "/exercises/" + item.id,
                  })
                }
              />
            </>
          )}
        </Surface>
      ))}
      {plan.muscle_coverage.length > 0 && (
        <Surface style={{ gap: 8 }}>
          <Copy variant="title">{t("پوشش عضلات")}</Copy>
          {plan.muscle_coverage.map((m) => (
            <Copy key={m.id}>
              {m.name_fa}: {m.primary_exercise_count} {t("اصلی")} ·{" "}
              {m.secondary_exercise_count} {t("کمکی")}
            </Copy>
          ))}
        </Surface>
      )}
      {managing && (
        <>
          <Copy variant="small">
            {t("تغییرات حرکت‌ها و ست‌ها پس از ذخیره هر بخش ثبت می‌شوند.")}
          </Copy>
          <Button
            label={t("ویرایش اطلاعات روتین")}
            secondary
            onPress={() => {
              setName(plan.name);
              setDescription(plan.description ?? "");
              setEditing(!editing);
            }}
          />
          {editing && (
            <Surface style={{ gap: 12 }}>
              <Field
                label={t("نام روتین")}
                value={name}
                maxLength={120}
                onChangeText={setName}
              />
              <Field
                label={t("توضیحات")}
                value={description}
                maxLength={2000}
                multiline
                onChangeText={setDescription}
              />
              <Button
                label={t("ذخیره تغییرات")}
                loading={mutate.isPending}
                onPress={() => {
                  const result = planFormSchema.safeParse({
                    name,
                    description,
                  });
                  if (!result.success) {
                    setLocalError(new Error("Invalid name"));
                    return;
                  }
                  setLocalError(null);
                  mutate.mutate({ method: "PATCH", body: result.data });
                }}
              />
            </Surface>
          )}
          <Button
            label={t("کپی روتین")}
            secondary
            loading={mutate.isPending}
            onPress={() =>
              mutate.mutate({ method: "POST", suffix: "/duplicate" })
            }
          />
          <Button
            label={t("اشتراک روتین")}
            secondary
            onPress={() =>
              router.push({ pathname: "/plan-share", params: { id: plan.id } })
            }
          />
          <ConfirmAction
            label={t(
              plan.is_archived ? "بازگرداندن از بایگانی" : "بایگانی برنامه",
            )}
            description={t(
              plan.is_archived
                ? "برنامه به فهرست جاری برگردد؟"
                : "برنامه بایگانی شود؟ تاریخچه تمرین حفظ می‌شود.",
            )}
            pending={mutate.isPending}
            onConfirm={() =>
              mutate.mutate({
                method: "PATCH",
                body: { is_archived: !plan.is_archived },
              })
            }
          />
          <ConfirmAction
            label={t("حذف روتین")}
            description={t("برنامه حذف شود؟ تاریخچه تمرین حفظ می‌شود.")}
            pending={mutate.isPending}
            onConfirm={() => mutate.mutate({ method: "DELETE" })}
          />
        </>
      )}
    </>
  );
}
export default function PlanDetail() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const owner = useOwner();
  const { t } = useI18n();
  const query = useQuery({
    queryKey: ["plan", owner, id],
    queryFn: ({ signal }) => getPlan(id, signal),
    enabled: !!owner && !!id,
    retry: false,
  });
  return (
    <Screen>
      <BackButton />
      {!owner ? (
        <SignInGate />
      ) : !id ? (
        <Copy>{t("روتین پیدا نشد.")}</Copy>
      ) : query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          retry={() => {
            void query.refetch();
          }}
        />
      ) : (
        <Editor key={id} plan={query.data} initialEditing={edit === "1"} />
      )}
    </Screen>
  );
}
