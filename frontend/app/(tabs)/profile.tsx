import { useState } from "react";
import { View, Linking } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Pencil,
  Settings,
  Library,
  ChartColumn,
  CalendarDays,
  Ruler,
} from "lucide-react-native";
import {
  Screen,
  Copy,
  Row,
  Button,
  LoadingState,
  ErrorState,
} from "../../src/ui/components";
import { Avatar, IconButton } from "../../src/ui/profile-components";
import { useSession } from "../../src/auth/session";
import { useI18n } from "../../src/i18n";
import { useOwner } from "../../src/ui/feature-components";
import {
  getStatistics,
  type StatisticsRange,
} from "../../src/features/profile/api";
import { StatisticsRangeSelect } from "../../src/features/profile/range-select";
import { TrainingChart } from "../../src/features/profile/chart";
export default function Profile() {
  const { t, language } = useI18n();
  const user = useSession((s) => s.user);
  const owner = useOwner();
  const [range, setRange] = useState<StatisticsRange>("three_months");
  const stats = useQuery({
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
    <Screen>
      <Row>
        <View style={{ flex: 1 }}>
          <Copy variant="title">{user?.username ?? t("پروفایل")}</Copy>
        </View>
        {user && (
          <IconButton
            label="ویرایش پروفایل"
            icon={Pencil}
            onPress={() => router.push("/account")}
          />
        )}
        <IconButton
          label="تنظیمات"
          icon={Settings}
          onPress={() => router.push("/settings")}
        />
      </Row>
      <View style={{ gap: 12 }}>
        <Row>
          <Avatar uri={user?.avatar} />
          <View style={{ flex: 1 }}>
            <Copy variant="title">
              {user?.name ?? user?.username ?? t("سلام، همراه آسپا")}
            </Copy>
            {user ? (
              <Copy>
                {stats.data ? stats.data.workout_count : "—"} {t("تمرین")}
              </Copy>
            ) : (
              <Copy>{t("برای شروع، وارد حساب شوید یا ثبت‌نام کنید.")}</Copy>
            )}
          </View>
        </Row>
        {user?.bio && <Copy>{user.bio}</Copy>}
        {user?.profile_link && (
          <Button
            label={t("رابط پروفایل")}
            secondary
            plain
            onPress={() => {
              void Linking.openURL(user.profile_link!);
            }}
          />
        )}
      </View>
      {!user ? (
        <Button
          label={t("ورود یا ثبت‌نام")}
          plain
          onPress={() => router.push("/login")}
        />
      ) : (
        <>
          {(stats.isPending || stats.isError) && rangeSelect}
          {stats.isPending ? (
            <LoadingState />
          ) : stats.isError ? (
            <ErrorState
              flat
              retry={() => {
                void stats.refetch();
              }}
            />
          ) : (
            <TrainingChart
              data={stats.data}
              flat
              headerAccessory={rangeSelect}
            />
          )}
          <Copy variant="title">{t("داشبورد")}</Copy>
          <View style={{ gap: 12 }}>
            <Row>
              <View style={{ flex: 1 }}>
                <Button
                  label={t("آمار")}
                  secondary
                  icon={ChartColumn}
                  onPress={() => router.push("/statistics")}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t("حرکت‌ها")}
                  secondary
                  icon={Library}
                  onPress={() => router.push("/exercises")}
                />
              </View>
            </Row>
            <Row>
              <View style={{ flex: 1 }}>
                <Button
                  label={t("اندازه‌ها")}
                  secondary
                  icon={Ruler}
                  disabled
                  onPress={() => {}}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t("تقویم")}
                  secondary
                  icon={CalendarDays}
                  onPress={() => router.push("/calendar")}
                />
              </View>
            </Row>
          </View>
        </>
      )}
    </Screen>
  );
}
