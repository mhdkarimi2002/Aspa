import { useEffect, useState } from "react";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Library } from "lucide-react-native";
import {
  Screen,
  Copy,
  Surface,
  Field,
  Button,
  EmptyState,
  LoadingState,
  ErrorState,
} from "../../src/ui/components";
import { Choice, PageButtons, useOwner } from "../../src/ui/feature-components";
import { useI18n } from "../../src/i18n";
import { getCatalog, listExercises } from "../../src/features/api";
export default function Exercises() {
  const { t } = useI18n();
  const owner = useOwner();
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState("name_fa");
  const [filters, setFilters] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(text.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [text]);
  const muscles = useQuery({
    queryKey: ["muscles"],
    queryFn: ({ signal }) => getCatalog("muscle-groups", signal),
  });
  const equipments = useQuery({
    queryKey: ["equipment"],
    queryFn: ({ signal }) => getCatalog("equipment", signal),
  });
  const query = useQuery({
    queryKey: [
      "exercises",
      owner,
      search,
      page,
      muscle,
      equipment,
      difficulty,
      sort,
    ],
    queryFn: ({ signal }) =>
      listExercises(
        {
          search,
          page,
          page_size: 20,
          muscle_group_id: muscle,
          equipment_id: equipment,
          difficulty,
          sort,
          direction: sort === "created_at" ? "desc" : "asc",
        },
        signal,
      ),
    retry: false,
  });
  return (
    <Screen>
      <Copy variant="title">{t("کتابخانه حرکت‌ها")}</Copy>
      <Copy>{t("حرکت مناسب را پیدا کنید و اجرای آن را یاد بگیرید.")}</Copy>
      <Field
        label={t("جستجوی حرکت")}
        value={text}
        maxLength={200}
        onChangeText={setText}
      />
      <Button
        label={t("فیلترها")}
        secondary
        selected={filters}
        onPress={() => setFilters(!filters)}
      />
      {filters && (
        <Surface style={{ gap: 16 }}>
          {muscles.isError || equipments.isError ? (
            <ErrorState
              retry={() => {
                void muscles.refetch();
                void equipments.refetch();
              }}
            />
          ) : (
            <>
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
              <Choice
                label={t("سطح حرکت")}
                value={difficulty}
                options={["", "beginner", "intermediate", "advanced"].map(
                  (id) => ({ id, name: t(id || "همه") }),
                )}
                onChange={(v) => {
                  setDifficulty(v);
                  setPage(1);
                }}
              />
            </>
          )}
          <Choice
            label={t("مرتب‌سازی")}
            value={sort}
            options={[
              { id: "name_fa", name: t("نام حرکت") },
              { id: "created_at", name: t("جدیدترین") },
            ]}
            onChange={(value) => {
              setSort(value);
              setPage(1);
            }}
          />
          <Button
            label={t("پاک کردن فیلترها")}
            secondary
            onPress={() => {
              setSort("name_fa");
              setMuscle("");
              setEquipment("");
              setDifficulty("");
              setText("");
              setSearch("");
              setPage(1);
            }}
          />
        </Surface>
      )}
      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          retry={() => {
            void query.refetch();
          }}
        />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          icon={Library}
          title={t("حرکتی پیدا نشد")}
          description={t("جستجو یا فیلترها را تغییر دهید.")}
        />
      ) : (
        <>
          {query.data.items.map((exercise) => (
            <Surface key={exercise.id} style={{ gap: 12 }}>
              <Copy variant="title">{exercise.name_fa}</Copy>
              <Copy>
                {exercise.primary_muscles.map((x) => x.name_fa).join(" · ")} ·{" "}
                {t(exercise.difficulty)}
              </Copy>
              <Copy variant="small">
                {exercise.equipment?.name_fa ?? t("بدون تجهیزات")}
                {exercise.is_custom ? " · " + t("حرکت شخصی") : ""}
              </Copy>
              <Button
                label={t("راهنمای حرکت")}
                secondary
                onPress={() =>
                  router.push({
                    pathname: "/exercise",
                    params: { id: exercise.id },
                  })
                }
              />
            </Surface>
          ))}
          <PageButtons
            page={page}
            pages={query.data.pages}
            onChange={setPage}
          />
        </>
      )}
    </Screen>
  );
}
