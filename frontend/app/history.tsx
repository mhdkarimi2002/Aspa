import { useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { History as HistoryIcon } from "lucide-react-native";
import {
  Screen,
  Copy,
  Surface,
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
  Row,
} from "../src/ui/components";
import { useI18n } from "../src/i18n";
import { getHistory } from "../src/features/api";
import {
  useOwner,
  SignInGate,
  BackButton,
  duration,
} from "../src/ui/feature-components";
import { useWorkouts } from "../src/features/workouts/provider";
import { View } from "react-native";
export default function History({ home = false }: { home?: boolean } = {}) {
  const { exercise, date } = useLocalSearchParams<{
    exercise?: string;
    date?: string;
  }>();
  const { t, language } = useI18n();
  const owner = useOwner();
  const [page, setPage] = useState(0);
  const { entries } = useWorkouts();
  const unsynced = entries.filter(
    (e) =>
      (e.dirty || e.pending) &&
      e.document.status === "completed" &&
      (!date ||
        new Date(e.document.completed_at!).toLocaleDateString("en-CA", {
          timeZone: "Asia/Tehran",
        }) === date) &&
      (!exercise ||
        e.document.exercises.some((x) => x.exercise_id === exercise)),
  );
  const query = useQuery({
    queryKey: ["history", owner, exercise, page, date],
    queryFn: ({ signal }) => getHistory(page * 10, exercise, signal, date),
    enabled: !!owner,
    retry: false,
  });
  return (
    <Screen>
      <Copy variant="title">
        {t(home ? "خانه" : exercise ? "تاریخچه حرکت" : "تاریخچه تمرین")}
      </Copy>
      {home && (
        <>
          <Copy>{t("تمرین‌های اخیر تو")}</Copy>
          <Button
            label={t("شروع تمرین")}
            onPress={() => router.push("/plans")}
          />
        </>
      )}
      {date && (
        <Copy>
          {new Date(date + "T12:00:00").toLocaleDateString(
            language === "fa" ? "fa-IR" : "en-US",
          )}
        </Copy>
      )}
      {!owner ? (
        <SignInGate />
      ) : (
        <>
          {unsynced.map((e) => (
            <Surface key={e.document.client_id} style={{ gap: 12 }}>
              <Copy>{e.document.plan_name}</Copy>
              <Copy>{t("روی دستگاه ذخیره شد؛ در انتظار همگام‌سازی.")}</Copy>
              <Button
                label={t("مشاهده تمرین")}
                secondary
                onPress={() =>
                  router.push({
                    pathname: "/workout",
                    params: { client: e.document.client_id },
                  })
                }
              />
            </Surface>
          ))}
          {query.isPending ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState
              retry={() => {
                void query.refetch();
              }}
            />
          ) : query.data.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title={t("تمرین کامل‌شده‌ای وجود ندارد")}
              description={t(
                "پس از پایان تمرین، نتیجه اینجا نمایش داده می‌شود.",
              )}
            />
          ) : (
            query.data.map((run) => (
              <Surface key={run.id} style={{ gap: 12 }}>
                <Copy variant="title">{run.plan_name}</Copy>
                <Copy>
                  {new Date(run.completed_at!).toLocaleDateString(
                    language === "fa" ? "fa-IR" : "en-US",
                  )}{" "}
                  · {duration(run.duration_seconds ?? 0)}
                </Copy>
                <Copy>
                  {run.exercises.reduce(
                    (sum, e) =>
                      sum + e.sets.filter((s) => !!s.completed_at).length,
                    0,
                  )}{" "}
                  {t("ست ثبت‌شده")}
                </Copy>
                <Button
                  label={t("مشاهده تمرین")}
                  secondary
                  onPress={() =>
                    router.push({
                      pathname: "/workout-summary",
                      params: { id: run.id },
                    })
                  }
                />
              </Surface>
            ))
          )}
          <Row>
            <View style={{ flex: 1 }}>
              <Button
                label={t("قبلی")}
                secondary
                disabled={page === 0}
                onPress={() => setPage(page - 1)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t("بعدی")}
                secondary
                disabled={!query.data || query.data.length < 10}
                onPress={() => setPage(page + 1)}
              />
            </View>
          </Row>
        </>
      )}
      {!home && <BackButton href="/profile" />}
    </Screen>
  );
}
