import { useEffect, useRef, useState, useCallback } from "react";
import { Platform, Pressable, ScrollView, View } from "react-native";
import { jalaaliMonthLength } from "jalaali-js";
import { BottomSheet } from "../../ui/bottom-sheet";
import { Button, Copy, Row } from "../../ui/components";
import { useI18n } from "../../i18n";
import { usePalette } from "../../ui/theme";
import { displayBirthdate } from "../../auth/calendar";

const HEIGHT = 48;
export function birthdayDays(year: number, month: number, persian: boolean) {
  return persian
    ? jalaaliMonthLength(year, month)
    : new Date(year, month, 0).getDate();
}
function Wheel({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: number[];
  value: number;
  onChange: (value: number) => void;
}) {
  const { language } = useI18n();
  const c = usePalette();
  const scroll = useRef<ScrollView>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (settle.current) clearTimeout(settle.current);
    },
    [],
  );
  const index = Math.max(0, values.indexOf(value));
  useEffect(() => {
    scroll.current?.scrollTo({ y: index * HEIGHT, animated: false });
  }, [index]);
  const select = (offset: number) =>
    onChange(
      values[
        Math.max(0, Math.min(values.length - 1, Math.round(offset / HEIGHT)))
      ],
    );
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Copy variant="small" style={{ textAlign: "center" }}>
        {label}
      </Copy>
      <View style={{ height: HEIGHT * 3, overflow: "hidden" }}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: HEIGHT,
            height: HEIGHT,
            left: 0,
            right: 0,
            backgroundColor: c.blue,
            borderRadius: 10,
          }}
        />
        <ScrollView
          ref={scroll}
          showsVerticalScrollIndicator={false}
          snapToInterval={HEIGHT}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={(e) => {
            if (Platform.OS !== "web") return;
            if (settle.current) clearTimeout(settle.current);
            const offset = e.nativeEvent.contentOffset.y;
            settle.current = setTimeout(() => select(offset), 160);
          }}
          onMomentumScrollEnd={(e) => select(e.nativeEvent.contentOffset.y)}
          onScrollEndDrag={(e) => {
            if (!e.nativeEvent.velocity?.y)
              select(e.nativeEvent.contentOffset.y);
          }}
          contentContainerStyle={{ paddingVertical: HEIGHT }}
        >
          {values.map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${n}`}
              accessibilityState={{ selected: n === value }}
              aria-pressed={n === value}
              onPress={() => onChange(n)}
              style={{ height: HEIGHT, justifyContent: "center" }}
            >
              <Copy
                style={{
                  textAlign: "center",
                  color: n === value ? c.primary : c.muted,
                }}
              >
                {n.toLocaleString(language === "fa" ? "fa-IR" : "en-US", {
                  useGrouping: false,
                })}
              </Copy>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
export function BirthdayPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const { t, language } = useI18n();
  const c = usePalette();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() =>
    displayBirthdate("2000-01-01", language).split("-").map(Number),
  );
  const close = useCallback(() => setOpen(false), []);
  const todayISO = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const today = displayBirthdate(todayISO, language).split("-").map(Number);
  const [year, month, day] = date;
  const monthLimit = year === today[0] ? today[1] : 12;
  const dayLimit =
    year === today[0] && month === today[1]
      ? today[2]
      : birthdayDays(year, month, language === "fa");
  const change = (part: number, n: number) => {
    const next = [...date];
    next[part] = n;
    if (next[0] === today[0]) next[1] = Math.min(next[1], today[1]);
    next[2] = Math.min(
      next[2],
      birthdayDays(next[0], next[1], language === "fa"),
    );
    if (next[0] === today[0] && next[1] === today[1])
      next[2] = Math.min(next[2], today[2]);
    setDate(next);
  };
  const firstYear = Math.min(language === "fa" ? 1278 : 1900, year);
  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const label = language === "fa" ? "تاریخ تولد (شمسی)" : "تاریخ تولد (میلادی)";
  return (
    <>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t(label)}
        aria-haspopup="dialog"
        accessibilityState={{ expanded: open, disabled }}
        onPress={() => {
          setDate(
            (value || displayBirthdate("2000-01-01", language))
              .split("-")
              .map(Number),
          );
          setOpen(true);
        }}
        style={{ minHeight: 48, justifyContent: "center" }}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <Copy>{t(label)}</Copy>
          <Copy style={{ color: c.primary }}>
            {value || t("انتخاب تاریخ تولد")}
          </Copy>
        </Row>
      </Pressable>
      {open && (
        <BottomSheet open={open} title={label} onClose={close}>
          <Row style={{ direction: "ltr", gap: 8 }}>
            <Wheel
              label={t("سال")}
              values={range(firstYear, today[0])}
              value={year}
              onChange={(n) => change(0, n)}
            />
            <Wheel
              label={t("ماه")}
              values={range(1, monthLimit)}
              value={month}
              onChange={(n) => change(1, n)}
            />
            <Wheel
              label={t("روز")}
              values={range(1, dayLimit)}
              value={day}
              onChange={(n) => change(2, n)}
            />
          </Row>
          <Button
            plain
            label={t("تأیید")}
            onPress={() => {
              onChange(
                date
                  .map((n, i) => String(n).padStart(i ? 2 : 4, "0"))
                  .join("-"),
              );
              close();
            }}
          />
        </BottomSheet>
      )}
    </>
  );
}
