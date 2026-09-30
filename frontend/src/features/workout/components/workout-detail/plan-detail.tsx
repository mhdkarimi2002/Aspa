"use client";
import { CalendarDays } from "lucide-react";
import DaysList from "../day-list";
import AddWorkoutDayDialog from "../add-workout-day-dialog";
import Link from "next/link";
import { GetWorkoutPlanDetailResponse } from "../../api/workout-types";
import { useThemeStore } from "@/stores/theme.store";

const copy = {
  fa: {
    workouts: "برنامه‌ها",
    day: "روز",
    archived: "بایگانی‌شده",
    empty: "هنوز روزی اضافه نکرده‌ای",
    newDay: "روز جدید",
    newDayDescription: "با دکمهٔ روز جدید، اولین روز این برنامه را بساز.",
  },
  en: {
    workouts: "Workouts",
    day: "Day",
    archived: "Archived",
    empty: "No days added yet",
    newDay: "New Day",
    newDayDescription: "Add a new day to the workout plan.",
  },
};

const PlanDetail = ({ plan }: { plan: GetWorkoutPlanDetailResponse }) => {
  const days = [...plan.days].sort((a, b) => a.position - b.position);
  const language = useThemeStore((state) => state.language);

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href="/workout" className="text-sm font-medium text-primary">
          {copy[language].workouts}
        </Link>
        <h1 className="text-3xl font-semibold">{plan.name}</h1>
        {plan.description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {plan.description}
          </p>
        ) : null}
      </div>

      <section aria-label="روزهای برنامه" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {days.length.toLocaleString("fa-IR")} {copy[language].day}
            {plan.is_archived ? (
              <>
                <span aria-hidden="true"> · </span>
                <span>{copy[language].archived}</span>
              </>
            ) : null}
          </p>
          <AddWorkoutDayDialog planId={plan.id} />
        </div>

        {days.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold">{copy[language].empty}</h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {copy[language].newDayDescription}
            </p>
          </div>
        ) : (
          <DaysList planId={plan.id} days={days} />
        )}
      </section>
    </>
  );
};

export default PlanDetail;
