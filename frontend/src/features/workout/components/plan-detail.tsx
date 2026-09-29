import { CalendarDays } from "lucide-react";
import DaysList from "./day-list";
import AddWorkoutDayDialog from "./add-workout-day-dialog";
import Link from "next/link";
import { GetWorkoutPlanDetailResponse } from "../api/workout-types";

const PlanDetail = ({ plan }: { plan: GetWorkoutPlanDetailResponse }) => {
  const days = [...plan.days].sort((a, b) => a.position - b.position);

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link href="/workout" className="text-sm font-medium text-primary">
          برنامه‌ها
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
            {days.length.toLocaleString("fa-IR")} روز
            {plan.is_archived ? (
              <>
                <span aria-hidden="true"> · </span>
                <span>بایگانی‌شده</span>
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
            <h2 className="text-base font-semibold">
              هنوز روزی اضافه نکرده‌ای
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              با دکمهٔ روز جدید، اولین روز این برنامه را بساز.
            </p>
          </div>
        ) : (
          <DaysList days={days} />
        )}
      </section>
    </>
  );
};

export default PlanDetail;
