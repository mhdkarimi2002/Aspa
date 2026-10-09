import { SetEditor, SetTableHeader } from "../src/features/workouts/set-editor";
import { usePreferences } from "../src/state/preferences";
import { PreviousPerformance } from "../src/features/workouts/previous-performance";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Screen,
  Copy,
  Surface,
  Field,
  Button,
  LoadingState,
} from "../src/ui/components";
import {
  useOwner,
  SignInGate,
  FeatureError,
  ConfirmAction,
  duration,
  PageButtons,
} from "../src/ui/feature-components";
import { useI18n } from "../src/i18n";
import { useWorkouts } from "../src/features/workouts/provider";
import { listExercises } from "../src/features/api";
import {
  uuid,
  type DraftSet,
  type DraftExercise,
} from "../src/features/workouts/model";
export default function Workout() {
  const { client } = useLocalSearchParams<{ client: string }>();
  const { t } = useI18n();
  const owner = useOwner();
  const cache = useQueryClient();
  const { engine, entries, loaded, storageError, syncing } = useWorkouts();
  const entry = entries.find((x) => x.document.client_id === client);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<unknown>(null);
  const [pending, setPending] = useState(false);
  const [replaceClient, setReplaceClient] = useState<string | null>(null);
  const [exerciseOptions, setExerciseOptions] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const catalog = useQuery({
    queryKey: ["workout-picker", owner, search, page],
    queryFn: ({ signal }) =>
      listExercises({ search: search.trim(), page, page_size: 10 }, signal),
    enabled: !!owner && picker,
    retry: false,
  });
  useEffect(() => {
    if (entry?.document.status !== "in_progress") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [entry?.document.status]);
  const act = async (task: () => Promise<void>) => {
    setPending(true);
    setError(null);
    try {
      await task();
      void engine?.flush().then(() => {
        void cache.invalidateQueries({ queryKey: ["history", owner] });
        void cache.invalidateQueries({ queryKey: ["statistics", owner] });
        void cache.invalidateQueries({ queryKey: ["calendar", owner] });
      });
    } catch (e) {
      setError(e);
    } finally {
      setPending(false);
    }
  };
  const patchSet = async (
    exercise: DraftExercise,
    set: DraftSet,
    patch: Partial<DraftSet>,
  ) => {
    await engine!.change(
      client,
      (doc) => ({
        ...doc,
        exercises: doc.exercises.map((e) =>
          e.client_id === exercise.client_id
            ? {
                ...e,
                sets: e.sets.map((s) =>
                  s.client_id === set.client_id
                    ? {
                        ...s,
                        ...patch,
                        completed_at: patch.completed_at
                          ? new Date(
                              Math.max(
                                Date.parse(patch.completed_at),
                                Date.parse(doc.started_at),
                              ),
                            ).toISOString()
                          : patch.completed_at === null
                            ? null
                            : s.completed_at,
                      }
                    : s,
                ),
              }
            : e,
        ),
      }),
      patch.completed_at &&
        usePreferences.getState().automaticRest &&
        exercise.rest_seconds > 0
        ? Date.parse(patch.completed_at) + exercise.rest_seconds * 1000
        : undefined,
    );
    void engine!.flush();
  };
  return (
    <Screen
      header={
        entry?.document.status === "in_progress" ? (
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Button
                label={t("کوچک کردن")}
                secondary
                onPress={() => router.replace("/plans")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t("پایان تمرین")}
                disabled={
                  storageError || pending || entry.problem === "conflict"
                }
                onPress={() =>
                  router.push({
                    pathname: "/finish-workout",
                    params: { client },
                  })
                }
              />
            </View>
          </View>
        ) : undefined
      }
    >
      {!owner ? (
        <SignInGate />
      ) : !loaded ? (
        <LoadingState />
      ) : !entry ? (
        <>
          <Copy>
            {t("تمرین روی این دستگاه پیدا نشد. از فهرست برنامه‌ها ادامه دهید.")}
          </Copy>
          <Button
            label={t("برنامه‌ها")}
            onPress={() => router.replace("/plans")}
          />
        </>
      ) : (
        <>
          <Copy variant="display">{t(entry.document.plan_name)}</Copy>
          <Surface style={{ gap: 8, padding: 16 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Copy variant="small">{t("مدت تمرین")}</Copy>
                <Copy style={{ writingDirection: "ltr" }}>
                  {duration(
                    (Date.parse(
                      entry.document.completed_at ??
                        new Date(now).toISOString(),
                    ) -
                      Date.parse(entry.document.started_at)) /
                      1000,
                  )}
                </Copy>
              </View>
              <View style={{ flex: 1 }}>
                <Copy variant="small">{t("ست ثبت‌شده")}</Copy>
                <Copy>
                  {entry.document.exercises.reduce(
                    (n, e) => n + e.sets.filter((s) => s.completed_at).length,
                    0,
                  )}
                </Copy>
              </View>
              <View style={{ flex: 1 }}>
                <Copy variant="small">{t("حجم ثبت‌شده")}</Copy>
                <Copy>
                  {entry.document.exercises
                    .flatMap((e) => e.sets)
                    .filter((s) => s.completed_at)
                    .reduce(
                      (n, s) => n + (s.reps ?? 0) * (s.weight_kg ?? 0),
                      0,
                    )}{" "}
                  {t("کیلوگرم")}
                </Copy>
              </View>
            </View>
            <Copy variant="small" accessibilityLiveRegion="polite">
              {t(
                entry.document.status === "in_progress"
                  ? "تمرین در حال انجام"
                  : entry.document.status === "completed"
                    ? "تمرین کامل شد"
                    : "تمرین لغو شد",
              )}{" "}
              ·{" "}
              {t(
                storageError
                  ? "ذخیره روی دستگاه ممکن نشد. فضای ذخیره‌سازی را بررسی کنید."
                  : syncing
                    ? "در حال همگام‌سازی…"
                    : entry.dirty || entry.pending
                      ? "روی دستگاه ذخیره شد؛ در انتظار همگام‌سازی."
                      : "با سرور همگام است.",
              )}
            </Copy>
            {(entry.problem || entry.document.status !== "in_progress") && (
              <Button
                label={t("همگام‌سازی اکنون")}
                secondary
                loading={syncing}
                onPress={() => {
                  void act(async () => {
                    await engine!.retry(client);
                    await engine!.restoreActive();
                  });
                }}
              />
            )}
          </Surface>
          {entry.document.status === "completed" && (
            <Button
              label={t("مشاهده تاریخچه")}
              onPress={() => router.replace("/history")}
            />
          )}
          {entry.problem === "conflict" && (
            <Surface style={{ gap: 12 }}>
              <Copy accessibilityRole="alert">
                {t(
                  "تمرین در دستگاه دیگری تغییر کرده است. قبل از ادامه نسخه را انتخاب کنید.",
                )}
              </Copy>
              {entry.remote ? (
                <>
                  <Copy>
                    {t("نسخه سرور")}: {entry.remote.plan_name} ·{" "}
                    {t(
                      entry.remote.status === "in_progress"
                        ? "تمرین در حال انجام"
                        : "تمرین بسته شده است",
                    )}
                  </Copy>
                  <ConfirmAction
                    label={t("استفاده از نسخه سرور")}
                    description={t(
                      "تغییرات ارسال‌نشده این دستگاه کنار گذاشته شود؟",
                    )}
                    pending={pending}
                    onConfirm={() => {
                      void act(async () => {
                        await engine!.resolve(client, "remote");
                        if (entry.remote?.client_id)
                          router.replace({
                            pathname: "/workout",
                            params: { client: entry.remote.client_id },
                          });
                      });
                    }}
                  />
                  {entry.remote.client_id === client &&
                    entry.remote.status === "in_progress" && (
                      <ConfirmAction
                        label={t("نگه داشتن تغییرات این دستگاه")}
                        description={t(
                          "نسخه سرور با تغییرات این دستگاه جایگزین شود؟",
                        )}
                        pending={pending}
                        onConfirm={() => {
                          void act(() => engine!.resolve(client, "local"));
                        }}
                      />
                    )}
                </>
              ) : (
                <Copy>
                  {t("برای دریافت نسخه سرور دوباره همگام‌سازی کنید.")}
                </Copy>
              )}
            </Surface>
          )}
          {(entry.problem === "invalid" || entry.problem === "auth") && (
            <Copy accessibilityRole="alert">
              {t(
                entry.problem === "auth"
                  ? "برای همگام‌سازی دوباره وارد حساب شوید."
                  : "سرور اطلاعات را نپذیرفت. مقادیر ست‌ها را بررسی کنید و دوباره تلاش کنید.",
              )}
            </Copy>
          )}
          {!!error && <FeatureError error={error} />}
          {entry.document.status === "in_progress" &&
            entry.rest_until !== null && (
              <Surface style={{ padding: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Copy>
                      {t("استراحت")} ·{" "}
                      {duration((entry.rest_until - now) / 1000)}
                    </Copy>
                    <Copy variant="small" accessibilityLiveRegion="polite">
                      {t(
                        now >= entry.rest_until
                          ? "استراحت تمام شد"
                          : "برای ست بعد آماده شوید.",
                      )}
                    </Copy>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label={t("پایان استراحت")}
                      secondary
                      onPress={() => {
                        void act(() => engine!.rest(client, null));
                      }}
                    />
                  </View>
                </View>
              </Surface>
            )}
          {entry.document.exercises.map((exercise) => (
            <View key={exercise.client_id} style={{ gap: 16 }}>
              <Copy variant="title">{exercise.name_fa}</Copy>
              <SetTableHeader />
              {exercise.sets.map((set, index) => (
                <SetEditor
                  key={set.client_id + String(set.completed_at)}
                  set={set}
                  exerciseId={exercise.exercise_id}
                  index={index}
                  disabled={
                    entry.document.status !== "in_progress" ||
                    pending ||
                    storageError ||
                    entry.problem === "conflict"
                  }
                  save={(patch) => patchSet(exercise, set, patch)}
                />
              ))}
              {entry.document.status === "in_progress" &&
                entry.problem !== "conflict" && (
                  <>
                    <Button
                      label={t("افزودن ست")}
                      secondary
                      disabled={
                        pending || storageError || exercise.sets.length >= 100
                      }
                      onPress={() => {
                        void act(() =>
                          engine!.change(client, (doc) => ({
                            ...doc,
                            exercises: doc.exercises.map((e) =>
                              e.client_id === exercise.client_id
                                ? {
                                    ...e,
                                    sets: [
                                      ...e.sets,
                                      {
                                        client_id: uuid(),
                                        target_reps:
                                          e.sets.at(-1)?.target_reps ?? 10,
                                        target_weight_kg:
                                          e.sets.at(-1)?.target_weight_kg ??
                                          null,
                                        reps: null,
                                        weight_kg: null,
                                        rpe: null,
                                        rir: null,
                                        completed_at: null,
                                      },
                                    ],
                                  }
                                : e,
                            ),
                          })),
                        );
                      }}
                    />
                    <Button
                      label={t("گزینه‌های حرکت")}
                      secondary
                      selected={exerciseOptions === exercise.client_id}
                      onPress={() =>
                        setExerciseOptions(
                          exerciseOptions === exercise.client_id
                            ? null
                            : exercise.client_id,
                        )
                      }
                    />
                    {exerciseOptions === exercise.client_id && (
                      <>
                        {exercise.exercise_id && (
                          <Button
                            label={t("راهنمای حرکت")}
                            secondary
                            onPress={() =>
                              router.push({
                                pathname: "/exercise",
                                params: { id: exercise.exercise_id! },
                              })
                            }
                          />
                        )}{" "}
                        {exercise.exercise_id && (
                          <PreviousPerformance
                            exerciseId={exercise.exercise_id}
                          />
                        )}
                        <ConfirmAction
                          label={t("جایگزینی حرکت")}
                          description={t(
                            "این حرکت جایگزین شود؟ ست‌های ثبت‌شده آن کنار گذاشته می‌شوند.",
                          )}
                          pending={pending}
                          onConfirm={() => {
                            setReplaceClient(exercise.client_id);
                            setPicker(true);
                          }}
                        />
                        <ConfirmAction
                          label={t("حذف حرکت")}
                          description={t(
                            "این حرکت و ست‌های آن از تمرین حذف شوند؟",
                          )}
                          pending={pending}
                          onConfirm={() => {
                            void act(() =>
                              engine!.change(client, (doc) => ({
                                ...doc,
                                exercises: doc.exercises.filter(
                                  (e) => e.client_id !== exercise.client_id,
                                ),
                              })),
                            );
                          }}
                        />
                      </>
                    )}
                  </>
                )}
            </View>
          ))}
          {entry.document.status === "in_progress" && (
            <>
              <Button
                label={t("افزودن حرکت به تمرین")}
                secondary
                disabled={
                  pending ||
                  storageError ||
                  entry.problem === "conflict" ||
                  entry.document.exercises.length >= 100
                }
                onPress={() => {
                  router.push({
                    pathname: "/pick-exercises",
                    params: { client },
                  });
                }}
              />
              {picker && (
                <Surface style={{ gap: 12 }}>
                  <Field
                    label={t("جستجوی حرکت")}
                    value={search}
                    maxLength={200}
                    onChangeText={(v) => {
                      setSearch(v);
                      setPage(1);
                    }}
                  />
                  {catalog.isPending ? (
                    <LoadingState />
                  ) : catalog.isError ? (
                    <FeatureError error={catalog.error} />
                  ) : (
                    <>
                      {catalog.data.items.map((ex) => (
                        <Button
                          key={ex.id}
                          label={ex.name_fa}
                          secondary
                          onPress={() => {
                            void act(async () => {
                              await engine!.change(client, (doc) => ({
                                ...doc,
                                exercises: (() => {
                                  const original = doc.exercises.find(
                                    (e) => e.client_id === replaceClient,
                                  );
                                  const added: DraftExercise = {
                                    client_id: uuid(),
                                    exercise_id: ex.id,
                                    name_fa: ex.name_fa,
                                    rest_seconds:
                                      original?.rest_seconds ??
                                      usePreferences.getState().defaultRest,
                                    sets: (
                                      original?.sets ?? [
                                        {
                                          target_reps: 10,
                                          target_weight_kg: null,
                                        },
                                      ]
                                    ).map((s) => ({
                                      client_id: uuid(),
                                      target_reps: s.target_reps,
                                      target_weight_kg: s.target_weight_kg,
                                      reps: null,
                                      weight_kg: null,
                                      rpe: null,
                                      rir: null,
                                      completed_at: null,
                                    })),
                                  };
                                  return replaceClient
                                    ? doc.exercises.map((e) =>
                                        e.client_id === replaceClient
                                          ? added
                                          : e,
                                      )
                                    : [...doc.exercises, added];
                                })(),
                              }));
                              setPicker(false);
                              setReplaceClient(null);
                            });
                          }}
                        />
                      ))}
                      <PageButtons
                        page={page}
                        pages={catalog.data.pages}
                        onChange={setPage}
                      />
                    </>
                  )}
                </Surface>
              )}
              <ConfirmAction
                label={t("لغو تمرین")}
                description={t(
                  "تمرین لغو شود؟ در تاریخچه کامل‌شده نمایش داده نمی‌شود.",
                )}
                pending={pending}
                onConfirm={() => {
                  void act(() =>
                    engine!.change(
                      client,
                      (doc) => ({
                        ...doc,
                        status: "cancelled",
                        completed_at: null,
                      }),
                      null,
                    ),
                  );
                }}
              />
            </>
          )}
          <Button
            label={t("بازگشت به برنامه‌ها")}
            secondary
            onPress={() => router.replace("/plans")}
          />
        </>
      )}
    </Screen>
  );
}
