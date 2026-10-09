import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Plus } from "lucide-react-native";
import {
  Screen,
  Copy,
  Button,
  Surface,
  EmptyState,
  LoadingState,
  ErrorState,
  Row,
} from "../../src/ui/components";
import { SignInGate, useOwner } from "../../src/ui/feature-components";
import { listPlans } from "../../src/features/api";
import { useWorkouts } from "../../src/features/workouts/provider";
import { StartWorkoutButton } from "../../src/features/workouts/start-button";
import { useI18n } from "../../src/i18n";
export default function Plans() {
  const { t } = useI18n();
  const owner = useOwner();
  const [archived, setArchived] = useState(false);
  const workouts = useWorkouts();
  const active = workouts.entries.find(
    (x) => x.document.status === "in_progress",
  );
  const query = useQuery({
    queryKey: ["plans", owner, archived],
    queryFn: ({ signal }) => listPlans(archived, signal),
    enabled: !!owner,
    retry: false,
  });
  return (
    <Screen>
      <Copy variant="display">{t("تمرین")}</Copy>
      {!owner ? (
        <SignInGate />
      ) : (
        <>
          {active && (
            <Surface style={{ gap: 12 }}>
              <Copy>
                {t("تمرین در حال انجام")}: {t(active.document.plan_name)}
              </Copy>
              <Button
                label={t("ادامه تمرین")}
                onPress={() =>
                  router.push({
                    pathname: "/workout",
                    params: { client: active.document.client_id },
                  })
                }
              />
            </Surface>
          )}
          <Copy variant="title">{t("شروع سریع")}</Copy>
          <StartWorkoutButton label="شروع تمرین خالی" />
          <Row>
            <View style={{ flex: 1 }}>
              <Copy variant="title">{t("روتین‌ها")}</Copy>
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t("روتین جدید")}
                icon={Plus}
                secondary
                onPress={() => router.push("/new-plan")}
              />
            </View>
          </Row>
          {query.isPending ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState
              retry={() => {
                void query.refetch();
              }}
            />
          ) : !query.data.length ? (
            <EmptyState
              icon={Dumbbell}
              title={t("هنوز روتینی ندارید")}
              description={t(
                "حرکت‌ها و ست‌ها را یک‌بار بچینید و هر بار از همین روتین شروع کنید.",
              )}
            />
          ) : (
            query.data.map((plan) => (
              <Surface key={plan.id} style={{ gap: 12 }}>
                <Copy variant="title">{plan.name}</Copy>
                <Copy variant="small">
                  {plan.exercises.length} {t("حرکت")} ·{" "}
                  {plan.exercises.reduce((n, e) => n + e.sets, 0)} {t("ست")}
                  {plan.is_archived ? " · " + t("بایگانی‌شده") : ""}
                </Copy>
                {plan.exercises.slice(0, 4).map((e) => (
                  <Copy key={e.id} variant="small">
                    {e.sets} × {e.exercise.name_fa}
                  </Copy>
                ))}
                {plan.exercises.length > 4 && (
                  <Copy variant="small">
                    {t("و {count} حرکت دیگر", {
                      count: String(plan.exercises.length - 4),
                    })}
                  </Copy>
                )}
                {!plan.is_archived && (
                  <StartWorkoutButton
                    plan={plan}
                    label={active ? "ادامه تمرین" : "شروع روتین"}
                  />
                )}
                <Button
                  label={t("مشاهده روتین")}
                  secondary
                  onPress={() =>
                    router.push({ pathname: "/plan", params: { id: plan.id } })
                  }
                />
              </Surface>
            ))
          )}
          <Button
            label={t(archived ? "پنهان کردن بایگانی" : "نمایش بایگانی")}
            secondary
            selected={archived}
            onPress={() => setArchived(!archived)}
          />
        </>
      )}
    </Screen>
  );
}
