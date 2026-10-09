import { useState } from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Screen,
  Copy,
  Surface,
  Field,
  Button,
  LoadingState,
  ErrorState,
  Row,
} from "../src/ui/components";
import {
  SignInGate,
  useOwner,
  FeatureError,
  ConfirmAction,
  PageButtons,
} from "../src/ui/feature-components";
import { getPlan, listExercises, planWrite } from "../src/features/api";
import {
  targetFormSchema,
  type Plan,
  type PlanItem,
} from "../src/features/contracts";
import { inputNumber } from "../src/features/numbers";
import { useI18n } from "../src/i18n";
function ItemEditor({ plan, item }: { plan: Plan; item?: PlanItem }) {
  const { t } = useI18n();
  const owner = useOwner();
  const cache = useQueryClient();
  const [exercise, setExercise] = useState(item?.exercise ?? null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [targets, setTargets] = useState(
    (
      item?.target_sets ?? [
        { target_reps: 10, target_weight_kg: null },
        { target_reps: 10, target_weight_kg: null },
        { target_reps: 10, target_weight_kg: null },
      ]
    ).map((s) => ({
      reps: String(s.target_reps),
      weight: s.target_weight_kg === null ? "" : String(s.target_weight_kg),
    })),
  );
  const [rest, setRest] = useState(String(item?.rest_seconds ?? 90));
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [validation, setValidation] = useState("");
  const catalog = useQuery({
    queryKey: ["exercise-picker", owner, search, page],
    queryFn: ({ signal }) =>
      listExercises({ search: search.trim(), page, page_size: 10 }, signal),
    enabled: !exercise,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const target_sets = targets.map((s) => {
        const result = targetFormSchema.parse({
          reps: inputNumber(s.reps),
          weight: s.weight.trim() === "" ? null : inputNumber(s.weight),
        });
        return { target_reps: result.reps, target_weight_kg: result.weight };
      });
      const rest_seconds = inputNumber(rest);
      if (
        !Number.isInteger(rest_seconds) ||
        rest_seconds < 0 ||
        rest_seconds > 3600 ||
        !exercise
      )
        throw new Error("Invalid form");
      const suffix = "/exercises" + (item ? "/" + item.id : "");
      if (item) {
        await planWrite(
          plan.id,
          { method: "PATCH", body: { rest_seconds, notes: notes || null } },
          suffix,
        );
        return planWrite(
          plan.id,
          { method: "PUT", body: { target_sets } },
          suffix + "/sets",
        );
      }
      return planWrite(
        plan.id,
        {
          method: "POST",
          body: {
            exercise_id: exercise.id,
            sets: target_sets.length,
            min_reps: Math.min(...target_sets.map((x) => x.target_reps)),
            max_reps: Math.max(...target_sets.map((x) => x.target_reps)),
            rest_seconds,
            notes: notes || null,
            target_sets,
          },
        },
        suffix,
      );
    },
    onSuccess: (value) => {
      cache.setQueryData(["plan", owner, plan.id], value);
      void cache.invalidateQueries({ queryKey: ["plans", owner] });
      router.replace({ pathname: "/plan", params: { id: plan.id, edit: "1" } });
    },
    onError: () => {
      void cache.invalidateQueries({ queryKey: ["plan", owner, plan.id] });
    },
  });
  return (
    <>
      <Copy variant="title">
        {t(item ? "ویرایش حرکت و ست‌ها" : "افزودن حرکت")}
      </Copy>
      {!exercise ? (
        <>
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
            <ErrorState
              retry={() => {
                void catalog.refetch();
              }}
            />
          ) : (
            <>
              {catalog.data.items.length === 0 && (
                <Copy>{t("حرکتی پیدا نشد")}</Copy>
              )}
              {catalog.data.items.map((x) => (
                <Button
                  key={x.id}
                  label={x.name_fa}
                  secondary
                  onPress={() => setExercise({ id: x.id, name_fa: x.name_fa })}
                />
              ))}
              <PageButtons
                page={page}
                pages={catalog.data.pages}
                onChange={setPage}
              />
            </>
          )}
        </>
      ) : (
        <>
          <Surface style={{ gap: 12 }}>
            <Copy variant="title">{exercise.name_fa}</Copy>
            {!item && (
              <Button
                label={t("انتخاب حرکت دیگر")}
                secondary
                onPress={() => setExercise(null)}
              />
            )}
            <Copy>
              {t("وزن خالی یعنی هدف تعیین نشده؛ صفر برای وزن بدن است.")}
            </Copy>
          </Surface>
          {targets.map((target, index) => (
            <Surface key={index} style={{ gap: 12 }}>
              <Copy>
                {t("ست")} {index + 1}
              </Copy>
              <Field
                label={`${t("تکرار هدف")} ${index + 1}`}
                inputDirection="ltr"
                keyboardType="number-pad"
                value={target.reps}
                onChangeText={(v) =>
                  setTargets(
                    targets.map((s, i) =>
                      i === index ? { ...s, reps: v } : s,
                    ),
                  )
                }
              />
              <Field
                label={`${t("وزن هدف (کیلوگرم)")} ${index + 1}`}
                inputDirection="ltr"
                keyboardType="decimal-pad"
                value={target.weight}
                onChangeText={(v) =>
                  setTargets(
                    targets.map((s, i) =>
                      i === index ? { ...s, weight: v } : s,
                    ),
                  )
                }
              />
            </Surface>
          ))}
          <Row>
            <View style={{ flex: 1 }}>
              <Button
                label={t("افزودن ست")}
                secondary
                disabled={targets.length >= 20 || mutation.isPending}
                onPress={() =>
                  setTargets([...targets, { ...targets[targets.length - 1] }])
                }
              />
            </View>
          </Row>
          {targets.length > 1 && (
            <ConfirmAction
              label={t("حذف آخرین ست")}
              description={t("آخرین ست و هدف آن حذف شود؟")}
              onConfirm={() => setTargets(targets.slice(0, -1))}
            />
          )}
          <Surface style={{ gap: 12 }}>
            <Field
              label={t("استراحت (ثانیه)")}
              value={rest}
              inputDirection="ltr"
              keyboardType="number-pad"
              onChangeText={setRest}
            />
            <Field
              label={t("یادداشت")}
              value={notes}
              multiline
              maxLength={500}
              onChangeText={setNotes}
            />
          </Surface>
          {validation && <Copy accessibilityRole="alert">{t(validation)}</Copy>}
          {mutation.isError && <FeatureError error={mutation.error} />}
          <Button
            label={t("ذخیره تغییرات")}
            loading={mutation.isPending}
            onPress={() => {
              const good =
                targets.every(
                  (s) =>
                    s.reps.trim() &&
                    targetFormSchema.safeParse({
                      reps: inputNumber(s.reps),
                      weight:
                        s.weight.trim() === "" ? null : inputNumber(s.weight),
                    }).success,
                ) &&
                rest.trim() &&
                Number.isInteger(inputNumber(rest)) &&
                inputNumber(rest) >= 0 &&
                inputNumber(rest) <= 3600;
              if (!good) {
                setValidation(
                  "تکرار ۱ تا ۱۰۰، وزن ۰ تا ۱۰۰۰ و استراحت ۰ تا ۳۶۰۰ وارد کنید.",
                );
                return;
              }
              setValidation("");
              mutation.mutate();
            }}
          />
        </>
      )}
      <Button
        label={t("بازگشت به برنامه")}
        secondary
        disabled={mutation.isPending}
        onPress={() =>
          router.replace({
            pathname: "/plan",
            params: { id: plan.id, edit: "1" },
          })
        }
      />
    </>
  );
}
export default function PlanExercise() {
  const { plan, item } = useLocalSearchParams<{
    plan: string;
    item?: string;
  }>();
  const owner = useOwner();
  const { t } = useI18n();
  const query = useQuery({
    queryKey: ["plan", owner, plan],
    queryFn: ({ signal }) => getPlan(plan, signal),
    enabled: !!owner && !!plan,
    retry: false,
  });
  return (
    <Screen>
      {!owner ? (
        <SignInGate />
      ) : !plan ? (
        <Copy>{t("برنامه پیدا نشد.")}</Copy>
      ) : query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          retry={() => {
            void query.refetch();
          }}
        />
      ) : item && !query.data.exercises.some((x) => x.id === item) ? (
        <Copy>{t("حرکت پیدا نشد.")}</Copy>
      ) : (
        <ItemEditor
          key={plan + item}
          plan={query.data}
          item={query.data.exercises.find((x) => x.id === item)}
        />
      )}
    </Screen>
  );
}
