import { toGregorian, toJalaali, jalaaliMonthLength } from "jalaali-js";
export function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function calendarMonth(date: Date, language: "fa" | "en") {
  const j = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const g =
    language === "fa"
      ? toGregorian(j.jy, j.jm, 1)
      : { gy: date.getFullYear(), gm: date.getMonth() + 1, gd: 1 };
  const start = new Date(g.gy, g.gm - 1, g.gd, 12);
  const days =
    language === "fa"
      ? jalaaliMonthLength(j.jy, j.jm)
      : new Date(g.gy, g.gm, 0).getDate();
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + days - 1,
    12,
  );
  const months = [
    isoDate(new Date(start.getFullYear(), start.getMonth(), 1, 12)),
  ];
  if (
    end.getMonth() !== start.getMonth() ||
    end.getFullYear() !== start.getFullYear()
  )
    months.push(isoDate(new Date(end.getFullYear(), end.getMonth(), 1, 12)));
  return {
    start,
    end,
    days,
    months,
    label: start.toLocaleDateString(language === "fa" ? "fa-IR" : "en-US", {
      year: "numeric",
      month: "long",
    }),
    offset: (start.getDay() - (language === "fa" ? 6 : 1) + 7) % 7,
  };
}
export function adjacentMonth(date: Date, language: "fa" | "en", step: number) {
  const month = calendarMonth(date, language);
  return step < 0
    ? new Date(
        month.start.getFullYear(),
        month.start.getMonth(),
        month.start.getDate() - 1,
        12,
      )
    : new Date(
        month.end.getFullYear(),
        month.end.getMonth(),
        month.end.getDate() + 1,
        12,
      );
}

export function calendarToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const value = (key: string) =>
    Number(parts.find((p) => p.type === key)?.value);
  return new Date(value("year"), value("month") - 1, value("day"), 12);
}
