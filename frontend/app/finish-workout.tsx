import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Screen,
  Copy,
  Surface,
  Field,
  Button,
  LoadingState,
} from "../src/ui/components";
import {
  FeatureError,
  SignInGate,
  useOwner,
  duration,
} from "../src/ui/feature-components";
import { useI18n } from "../src/i18n";
import { useWorkouts } from "../src/features/workouts/provider";
export default function FinishWorkout() {
  const { client } = useLocalSearchParams<{ client: string }>();
  const { t } = useI18n();
  const owner = useOwner();
  const cache = useQueryClient();
  const workouts = useWorkouts();
  const entry = workouts.entries.find((e) => e.document.client_id === client);
  const [name, setName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [now] = useState(() => Date.now());
  const sets =
    entry?.document.exercises
      .flatMap((e) => e.sets)
      .filter((s) => s.completed_at) ?? [];
  return (
    <Screen>
      <Copy variant="display">{t("پایان تمرین")}</Copy>
      {!owner ? (
        <SignInGate />
      ) : !workouts.loaded ? (
        <LoadingState />
      ) : !entry ? (
        <Copy>{t("تمرین پیدا نشد.")}</Copy>
      ) : (
        <>
          <Surface style={{ gap: 12 }}>
            <Field
              label={t("نام تمرین")}
              value={name ?? t(entry.document.plan_name)}
              maxLength={120}
              onChangeText={setName}
            />
            <Copy>
              {t("مدت تمرین")}:{" "}
              {duration((now - Date.parse(entry.document.started_at)) / 1000)}
            </Copy>
            <Copy>
              {sets.length} {t("ست ثبت‌شده")} ·{" "}
              {sets.reduce(
                (sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0),
                0,
              )}{" "}
              {t("کیلوگرم")}
            </Copy>
          </Surface>
          {entry.document.exercises.map((e) => (
            <Surface key={e.client_id} style={{ gap: 8 }}>
              <Copy>{e.name_fa}</Copy>
              {e.sets
                .filter((s) => s.completed_at)
                .map((s, i) => (
                  <Copy key={s.client_id} variant="small">
                    {i + 1}. {s.weight_kg} {t("کیلوگرم")} × {s.reps}{" "}
                    {t("تکرار")}
                  </Copy>
                ))}
            </Surface>
          ))}
          <Copy>{t("ست‌های ثبت‌نشده در نتیجه تمرین حساب نمی‌شوند.")}</Copy>
          {sets.length === 0 && (
            <Copy accessibilityRole="alert">
              {t(
                "هیچ ستی ثبت نشده است. می‌توانید برگردید و ست‌ها را ثبت کنید.",
              )}
            </Copy>
          )}
          {!!error && <FeatureError error={error} />}
          <Button
            label={t("ذخیره تمرین")}
            loading={pending}
            disabled={
              workouts.storageError ||
              entry.problem === "conflict" ||
              entry.document.status !== "in_progress"
            }
            onPress={() => {
              const title = (name ?? t(entry.document.plan_name)).trim();
              if (!title) {
                setError(new Error(t("نام تمرین را وارد کنید.")));
                return;
              }
              setPending(true);
              setError(null);
              void workouts
                .engine!.change(
                  client,
                  (doc) => ({
                    ...doc,
                    plan_name: title,
                    status: "completed",
                    completed_at: new Date(
                      Math.max(
                        Date.now(),
                        Date.parse(doc.started_at),
                        ...doc.exercises.flatMap((e) =>
                          e.sets.map((s) =>
                            s.completed_at ? Date.parse(s.completed_at) : 0,
                          ),
                        ),
                      ),
                    ).toISOString(),
                  }),
                  null,
                )
                .then(() => {
                  void workouts.engine!.flush().then(() => {
                    void cache.invalidateQueries({
                      queryKey: ["history", owner],
                    });
                    void cache.invalidateQueries({
                      queryKey: ["previous-performance", owner],
                    });
                    void cache.invalidateQueries({
                      queryKey: ["statistics", owner],
                    });
                    void cache.invalidateQueries({
                      queryKey: ["calendar", owner],
                    });
                  });
                  router.replace({ pathname: "/workout", params: { client } });
                })
                .catch(setError)
                .finally(() => setPending(false));
            }}
          />
          <Button
            label={t("بازگشت به تمرین")}
            secondary
            disabled={pending}
            onPress={() =>
              router.replace({ pathname: "/workout", params: { client } })
            }
          />
        </>
      )}
    </Screen>
  );
}
