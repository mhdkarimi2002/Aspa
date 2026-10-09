import { type ReactNode, useState } from "react";
import { Pressable, View } from "react-native";
import { Copy, Row, Surface } from "../../ui/components";
import { usePalette } from "../../ui/theme";
import { useI18n } from "../../i18n";
import type { Statistics } from "./api";
export function TrainingChart({
  data,
  flat = false,
  headerAccessory,
}: {
  data: Statistics;
  flat?: boolean;
  headerAccessory?: ReactNode;
}) {
  const c = usePalette();
  const Container = flat ? View : Surface;
  const { t, language } = useI18n();
  const [metric, setMetric] = useState<
    "duration_seconds" | "volume_kg" | "reps"
  >("duration_seconds");
  const [focusedMetric, setFocusedMetric] = useState<string | null>(null);
  const max = data.weeks.reduce(
    (largest, week) => Math.max(largest, week[metric]),
    1,
  );
  const number = (v: number) =>
    v.toLocaleString(language, { maximumFractionDigits: 1 });
  const value = (v: number) =>
    metric === "duration_seconds"
      ? number(v / 60) + " " + t("دقیقه")
      : number(v) +
        (metric === "volume_kg" ? " " + t("کیلوگرم") : " " + t("تکرار"));
  return (
    <Container style={{ gap: 8, padding: flat ? 0 : 12 }}>
      <Row style={{ direction: "ltr", gap: 8 }}>
        <Copy
          accessibilityLiveRegion="polite"
          style={{ flex: 1, minWidth: 0, textAlign: "left" }}
        >
          {t(
            metric === "duration_seconds"
              ? "{count} دقیقه این هفته"
              : metric === "volume_kg"
                ? "{count} کیلوگرم این هفته"
                : "{count} تکرار این هفته",
            {
              count: number(
                (data.weeks.at(-1)?.[metric] ?? 0) /
                  (metric === "duration_seconds" ? 60 : 1),
              ),
            },
          )}
        </Copy>
        {headerAccessory}
      </Row>
      <View accessibilityLabel={t("نمودار تمرین‌های هفتگی")} style={{ gap: 8 }}>
        <Copy variant="small" style={{ color: c.muted }}>
          {value(max)}
        </Copy>
        <View
          style={{
            height: 130,
            flexDirection: "row",
            direction: "ltr",
            gap: data.weeks.length > 52 ? 0 : 2,
            alignItems: "flex-end",
            borderBottomWidth: 1,
            borderColor: c.border,
          }}
        >
          {data.weeks.map((week) => (
            <View
              key={week.date}
              accessibilityLabel={
                new Date(week.date + "T12:00:00").toLocaleDateString(
                  language === "fa" ? "fa-IR" : "en-US",
                ) +
                ": " +
                value(week[metric])
              }
              style={{
                flex: 1,
                height: "100%",
                justifyContent: "flex-end",
                minWidth: 0,
              }}
            >
              <View
                style={{
                  height: Math.max(
                    week[metric] > 0 ? 4 : 0,
                    (week[metric] / max) * 120,
                  ),
                  backgroundColor: c.primary,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                }}
              />
            </View>
          ))}
        </View>
        <Row style={{ justifyContent: "space-between", direction: "ltr" }}>
          {[data.weeks[0], data.weeks.at(-1)].map((week, i) => (
            <Copy key={i} variant="small" style={{ color: c.muted }}>
              {week
                ? new Date(week.date + "T12:00:00").toLocaleDateString(
                    language === "fa" ? "fa-IR" : "en-US",
                    { month: "short", day: "numeric" },
                  )
                : ""}
            </Copy>
          ))}
        </Row>
      </View>
      <Row style={{ gap: 8 }}>
        {(["duration_seconds", "volume_kg", "reps"] as const).map((key) => (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={t(
              key === "duration_seconds"
                ? "مدت"
                : key === "volume_kg"
                  ? "حجم"
                  : "تکرار",
            )}
            accessibilityState={{ selected: metric === key }}
            aria-pressed={metric === key}
            onFocus={() => setFocusedMetric(key)}
            onBlur={() => setFocusedMetric(null)}
            onPress={() => setMetric(key)}
            style={({ pressed }) => ({
              minHeight: 48,
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: focusedMetric === key ? c.text : "transparent",
                backgroundColor: metric === key ? c.primary : c.border,
              }}
            >
              <Copy
                control
                style={{
                  color: metric === key ? c.background : c.text,
                  textAlign: "center",
                }}
              >
                {t(
                  key === "duration_seconds"
                    ? "مدت"
                    : key === "volume_kg"
                      ? "حجم"
                      : "تکرار",
                )}
              </Copy>
            </View>
          </Pressable>
        ))}
      </Row>
    </Container>
  );
}
