import { usePreferences } from "../src/state/preferences";
import { useState } from "react";
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
  ErrorState,
  Row,
} from "../src/ui/components";
import {
  SignInGate,
  useOwner,
  FeatureError,
  PageButtons,
  Choice,
} from "../src/ui/feature-components";
import { listExercises, planWrite, getCatalog } from "../src/features/api";
import type { Exercise } from "../src/features/contracts";
import { useWorkouts } from "../src/features/workouts/provider";
import { uuid } from "../src/features/workouts/model";
import { useI18n } from "../src/i18n";
export default function PickExercises() {
  const { plan, client } = useLocalSearchParams<{
    plan?: string;
    client?: string;
  }>();
  const { t } = useI18n();
  const owner = useOwner();
  const cache = useQueryClient();
  const workouts = useWorkouts();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [selected, setSelected] = useState<Record<string, Exercise>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const catalog = useQuery({
    queryKey: ["pick-exercises", owner, search, page, muscle, equipment],
    queryFn: ({ signal }) =>
      listExercises(
        {
          search: search.trim(),
          page,
          page_size: 20,
          muscle_group_id: muscle,
          equipment_id: equipment,
        },
        signal,
      ),
    enabled: !!owner,
    retry: false,
  });
  const muscles = useQuery({
    queryKey: ["muscle-groups", owner],
    queryFn: ({ signal }) => getCatalog("muscle-groups", signal),
    enabled: !!owner,
  });
  const equipments = useQuery({
    queryKey: ["equipment", owner],
    queryFn: ({ signal }) => getCatalog("equipment", signal),
    enabled: !!owner,
  });
  const count = Object.keys(selected).length;
  const back = () => {
    if (plan)
      router.replace({ pathname: "/plan", params: { id: plan, edit: "1" } });
    else if (client)
      router.replace({ pathname: "/workout", params: { client } });
    else router.replace("/plans");
  };
  const add = async () => {
    if (!plan && !client) throw new Error("No routine or workout selected");
    if (plan) {
      for (const exercise of Object.values(selected)) {
        const value = await planWrite(
          plan,
          {
            method: "POST",
            body: {
              exercise_id: exercise.id,
              sets: 3,
              min_reps: 10,
              max_reps: 10,
              rest_seconds: usePreferences.getState().defaultRest,
              target_sets: Array.from({ length: 3 }, () => ({
                target_reps: 10,
                target_weight_kg: null,
              })),
            },
          },
          "/exercises",
        );
        cache.setQueryData(["plan", owner, plan], value);
        setSelected((previous) => {
          const next = { ...previous };
          delete next[exercise.id];
          return next;
        });
      }
      void cache.invalidateQueries({ queryKey: ["plans", owner] });
    } else {
      await workouts.engine!.change(client!, (doc) => ({
        ...doc,
        exercises: [
          ...doc.exercises,
          ...Object.values(selected).map((e) => ({
            client_id: uuid(),
            exercise_id: e.id,
            name_fa: e.name_fa,
            rest_seconds: usePreferences.getState().defaultRest,
            sets: Array.from({ length: 3 }, () => ({
              client_id: uuid(),
              target_reps: 10,
              target_weight_kg: null,
              reps: null,
              weight_kg: null,
              rpe: null,
              rir: null,
              completed_at: null,
            })),
          })),
        ],
      }));
      void workouts.engine!.flush();
    }
    back();
  };
  return (
    <Screen
      header={
        <Row>
          <View style={{ flex: 1 }}>
            <Button
              label={t("انصراف")}
              secondary
              disabled={pending}
              onPress={back}
            />
          </View>
          <View style={{ flex: 2 }}>
            <Button
              label={t("افزودن {count} حرکت", { count: String(count) })}
              disabled={
                !owner ||
                !count ||
                (!plan && (!workouts.loaded || workouts.storageError))
              }
              loading={pending}
              onPress={() => {
                setPending(true);
                setError(null);
                void add()
                  .catch(setError)
                  .finally(() => setPending(false));
              }}
            />
          </View>
        </Row>
      }
    >
      <Copy variant="title">{t("انتخاب حرکت‌ها")}</Copy>
      {!owner ? (
        <SignInGate />
      ) : (
        <>
          <Field
            label={t("جستجوی حرکت")}
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
          <Choice
            label={t("عضله")}
            value={muscle}
            options={[
              { id: "", name: t("همه") },
              ...(muscles.data ?? []).map((x) => ({
                id: x.id,
                name: x.name_fa,
              })),
            ]}
            onChange={(v) => {
              setMuscle(v);
              setPage(1);
            }}
          />
          <Choice
            label={t("تجهیزات")}
            value={equipment}
            options={[
              { id: "", name: t("همه") },
              ...(equipments.data ?? []).map((x) => ({
                id: x.id,
                name: x.name_fa,
              })),
            ]}
            onChange={(v) => {
              setEquipment(v);
              setPage(1);
            }}
          />
          {!!error && <FeatureError error={error} />}
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
              {catalog.data.items.map((exercise) => (
                <Surface key={exercise.id} style={{ padding: 12, gap: 8 }}>
                  <Button
                    label={exercise.name_fa}
                    secondary
                    selected={!!selected[exercise.id]}
                    disabled={pending}
                    onPress={() =>
                      setSelected((previous) => {
                        const next = { ...previous };
                        if (next[exercise.id]) delete next[exercise.id];
                        else next[exercise.id] = exercise;
                        return next;
                      })
                    }
                  />
                  <Copy variant="small">
                    {exercise.primary_muscles.map((x) => x.name_fa).join(" · ")}
                  </Copy>
                </Surface>
              ))}
              {!catalog.data.items.length && (
                <Copy>{t("حرکتی پیدا نشد.")}</Copy>
              )}
              <PageButtons
                page={page}
                pages={catalog.data.pages}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}
    </Screen>
  );
}
