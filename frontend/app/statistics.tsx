import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Screen,
  Copy,
  Surface,
  LoadingState,
  ErrorState,
} from "../src/ui/components";
import { ProfileHeader } from "../src/ui/profile-components";
import { useOwner, SignInGate, duration } from "../src/ui/feature-components";
import { useI18n } from "../src/i18n";
import {
  getStatistics,
  type StatisticsRange,
} from "../src/features/profile/api";
import { StatisticsRangeSelect } from "../src/features/profile/range-select";
import { TrainingChart } from "../src/features/profile/chart";
export default function Statistics() {
  const { t, language } = useI18n();
  const owner = useOwner();
  const [range, setRange] = useState<StatisticsRange>("three_months");
  const query = useQuery({
    queryKey: ["statistics", owner, range, language],
    queryFn: ({ signal }) => getStatistics(range, language, signal),
    enabled: !!owner,
    retry: false,
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === owner ? previousData : undefined,
  });
  const rangeSelect = (
    <StatisticsRangeSelect value={range} onChange={setRange} />
  );
  return (
    <Screen header={<ProfileHeader title="آمار" />}>
      {!owner ? (
        <SignInGate />
      ) : (
        <>
          {(query.isPending || query.isError) && rangeSelect}
          {query.isPending ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState
              retry={() => {
                void query.refetch();
              }}
            />
          ) : (
            <>
              <TrainingChart data={query.data} headerAccessory={rangeSelect} />
              <Surface style={{ gap: 12 }}>
                <Copy variant="title">{t("مجموع عملکرد")}</Copy>
                <Copy>
                  {query.data.workout_count.toLocaleString(language)}{" "}
                  {t("تمرین")}
                </Copy>
                <Copy>
                  {t("مدت تمرین")}: {duration(query.data.duration_seconds)}
                </Copy>
                <Copy>
                  {t("حجم ثبت‌شده")}:{" "}
                  {query.data.volume_kg.toLocaleString(language)} {t("کیلوگرم")}
                </Copy>
                <Copy>
                  {query.data.reps.toLocaleString(language)} {t("تکرار")}
                </Copy>
              </Surface>
            </>
          )}
        </>
      )}
    </Screen>
  );
}
