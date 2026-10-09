import { StartWorkoutButton } from "../src/features/workouts/start-button";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Screen,
  Copy,
  Surface,
  Button,
  LoadingState,
  ErrorState,
} from "../src/ui/components";
import {
  BackButton,
  useOwner,
  SignInGate,
  duration,
} from "../src/ui/feature-components";
import { getRun } from "../src/features/api";
import { useI18n } from "../src/i18n";
export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useI18n();
  const owner = useOwner();
  const query = useQuery({
    queryKey: ["run", owner, id],
    queryFn: ({ signal }) => getRun(id, signal),
    enabled: !!owner && !!id,
    retry: false,
  });
  return (
    <Screen>
      <Copy variant="title">{t("خلاصه تمرین")}</Copy>
      {!owner ? (
        <SignInGate />
      ) : !id ? (
        <Copy>{t("تمرین پیدا نشد.")}</Copy>
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
            <Copy variant="title">{query.data.plan_name}</Copy>
            <Copy>
              {new Date(
                query.data.completed_at ?? query.data.started_at,
              ).toLocaleDateString(language === "fa" ? "fa-IR" : "en-US")}
            </Copy>
            <Copy>
              {t("مدت تمرین")}: {duration(query.data.duration_seconds ?? 0)}
            </Copy>
            <Copy>
              {t("حجم ثبت‌شده")}:{" "}
              {query.data.exercises
                .reduce(
                  (sum, e) =>
                    sum +
                    e.sets
                      .filter(
                        (s) =>
                          s.completed_at &&
                          s.reps !== null &&
                          s.weight_kg !== null,
                      )
                      .reduce((n, s) => n + s.reps! * s.weight_kg!, 0),
                  0,
                )
                .toLocaleString(language)}{" "}
              {t("کیلوگرم")}
            </Copy>
          </Surface>
          <StartWorkoutButton run={query.data} label="تکرار این تمرین" />
          {query.data.exercises.map((e) => (
            <Surface key={e.id} style={{ gap: 12 }}>
              <Copy variant="title">{e.name_fa}</Copy>
              {e.sets.map((s, i) => (
                <Copy key={s.id}>
                  {t("ست")} {i + 1}:{" "}
                  {s.completed_at
                    ? `${s.reps} ${t("تکرار")} · ${s.weight_kg} ${t("کیلوگرم")}`
                    : t("ثبت نشده")}
                  {s.rpe !== null ? ` · RPE ${s.rpe}` : ""}
                  {s.rir !== null ? ` · RIR ${s.rir}` : ""}
                </Copy>
              ))}
              {e.exercise_id && (
                <Button
                  label={t("تاریخچه حرکت")}
                  secondary
                  onPress={() =>
                    router.push({
                      pathname: "/history",
                      params: { exercise: e.exercise_id! },
                    })
                  }
                />
              )}
            </Surface>
          ))}
        </>
      )}
      <BackButton href="/history" />
    </Screen>
  );
}
