import { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Screen,
  Copy,
  Surface,
  Button,
  Row,
  LoadingState,
  ErrorState,
} from "../src/ui/components";
import { ProfileHeader } from "../src/ui/profile-components";
import { usePalette } from "../src/ui/theme";
import { useOwner, SignInGate } from "../src/ui/feature-components";
import { useI18n } from "../src/i18n";
import { getCalendar } from "../src/features/profile/api";
import {
  isoDate,
  calendarMonth,
  adjacentMonth,
  calendarToday,
} from "../src/features/profile/calendar";
export default function Calendar() {
  const { t, language } = useI18n();
  const c = usePalette();
  const owner = useOwner();
  const [month, setMonth] = useState(() => {
    return calendarToday();
  });
  const model = calendarMonth(month, language);
  const key = model.months.join(",");
  const query = useQuery({
    queryKey: ["calendar", owner, key, language],
    queryFn: async ({ signal }) => {
      const result = (
        await Promise.all(model.months.map((m) => getCalendar(m, signal)))
      ).flat();
      return result.filter(
        (day) =>
          day.date >= isoDate(model.start) && day.date <= isoDate(model.end),
      );
    },
    enabled: !!owner,
    retry: false,
  });
  const map = new Map(query.data?.map((day) => [day.date, day]) ?? []);
  const days = model.days;
  const offset = model.offset;
  const count = Math.ceil((offset + days) / 7) * 7;
  return (
    <Screen header={<ProfileHeader title="تقویم" />}>
      {!owner ? (
        <SignInGate />
      ) : (
        <>
          <Row>
            <View style={{ flex: 1 }}>
              <Button
                label={t("ماه قبل")}
                secondary
                disabled={month.getFullYear() <= 1900}
                onPress={() => setMonth(adjacentMonth(month, language, -1))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t("ماه بعد")}
                secondary
                disabled={month.getFullYear() >= 2100}
                onPress={() => setMonth(adjacentMonth(month, language, 1))}
              />
            </View>
          </Row>
          <Copy variant="title">{model.label}</Copy>
          {query.isPending ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState
              retry={() => {
                void query.refetch();
              }}
            />
          ) : (
            <Surface style={{ padding: 8, gap: 4 }}>
              <Row style={{ gap: 0 }}>
                {Array.from({ length: 7 }, (_, i) => (
                  <Copy
                    key={i}
                    variant="small"
                    style={{ flex: 1, textAlign: "center" }}
                  >
                    {new Date(
                      2026,
                      0,
                      language === "fa" ? 3 + i : 5 + i,
                      12,
                    ).toLocaleDateString(
                      language === "fa" ? "fa-IR" : "en-US",
                      { weekday: "narrow" },
                    )}
                  </Copy>
                ))}
              </Row>
              {Array.from({ length: count / 7 }, (_, row) => (
                <Row key={row} style={{ gap: 0 }}>
                  {Array.from({ length: 7 }, (_, col) => {
                    const day = row * 7 + col - offset + 1;
                    const valid = day > 0 && day <= days;
                    const date = valid
                      ? isoDate(
                          new Date(
                            model.start.getFullYear(),
                            model.start.getMonth(),
                            model.start.getDate() + day - 1,
                            12,
                          ),
                        )
                      : "";
                    const entry = map.get(date);
                    return (
                      <Pressable
                        key={col}
                        accessibilityRole="button"
                        accessibilityLabel={
                          valid
                            ? new Date(date + "T12:00:00").toLocaleDateString(
                                language === "fa" ? "fa-IR" : "en-US",
                              ) +
                              " · " +
                              (entry?.workouts ?? 0) +
                              " " +
                              t("تمرین")
                            : undefined
                        }
                        accessibilityState={{ disabled: !entry }}
                        disabled={!entry}
                        onPress={() =>
                          router.push({
                            pathname: "/history",
                            params: { date },
                          })
                        }
                        style={{
                          flex: 1,
                          minHeight: 56,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 12,
                          backgroundColor: entry ? c.blue : c.surface,
                        }}
                      >
                        <Copy>{valid ? day.toLocaleString(language) : ""}</Copy>
                        {entry && (
                          <View
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: 3,
                              backgroundColor: c.primary,
                            }}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </Row>
              ))}
            </Surface>
          )}
          {query.data?.length === 0 && (
            <Copy>{t("در این ماه تمرینی ثبت نشده است.")}</Copy>
          )}
        </>
      )}
    </Screen>
  );
}
