import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  Button,
  Surface,
  LoadingState,
  ErrorState,
} from "../../ui/components";
import { useOwner } from "../../ui/feature-components";
import { useI18n } from "../../i18n";
import { getHistory } from "../api";
export function PreviousPerformance({ exerciseId }: { exerciseId: string }) {
  const { t, language } = useI18n();
  const owner = useOwner();
  const [open, setOpen] = useState(false);
  const query = useQuery({
    queryKey: ["previous-performance", owner, exerciseId],
    queryFn: ({ signal }) => getHistory(0, exerciseId, signal),
    enabled: open && !!owner,
    retry: false,
  });
  const last = query.data?.[0];
  const exercise = last?.exercises.find((e) => e.exercise_id === exerciseId);
  return (
    <>
      <Button
        label={t("عملکرد قبلی")}
        secondary
        selected={open}
        onPress={() => setOpen(!open)}
      />
      {open && (
        <Surface style={{ gap: 8 }}>
          {query.isPending ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState
              retry={() => {
                void query.refetch();
              }}
            />
          ) : !last ? (
            <Copy>{t("هنوز عملکردی برای این حرکت ثبت نشده است.")}</Copy>
          ) : (
            <>
              <Copy>
                {new Date(last.completed_at!).toLocaleDateString(
                  language === "fa" ? "fa-IR" : "en-US",
                )}
              </Copy>
              {exercise?.sets
                .filter((s) => s.completed_at)
                .map((s, index) => (
                  <Copy key={s.id}>
                    {t("ست")} {index + 1}: {s.reps} {t("تکرار")} · {s.weight_kg}{" "}
                    {t("کیلوگرم")}
                  </Copy>
                ))}
            </>
          )}
        </Surface>
      )}
    </>
  );
}
