import { ClipboardList } from "lucide-react";
import { WorkoutPlan } from "../api/workout-types";
import Link from "next/link";
import { cn } from "cn";

const WorkoutPlanCard = ({ plan }: { plan: WorkoutPlan }) => {
  const dateFormat = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" });

  const created = dateFormat.format(new Date(plan.created_at));
  const dayCount = plan.days.length;

  return (
    <Link
      href={`/workout/${plan.id}`}
      className={cn(
        plan.is_active ? "border-primary" : "border-border",
        "flex h-full flex-col gap-4 rounded-2xl border bg-card p-4",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <ClipboardList className="size-5" aria-hidden="true" />
        </span>
        <div className="flex w-full min-w-0 items-center justify-between gap-2">
          <h2 className="min-w-0 truncate text-base font-semibold">
            {plan.name}
          </h2>
          <span
            className={cn(
              "inline-flex h-7 shrink-0 items-center rounded-full px-3 text-xs font-medium",
              plan.is_active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {plan.is_active ? "فعال" : "غیرفعال"}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {plan.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {plan.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">بدون توضیح</p>
        )}
      </div>
      <p className="mt-auto text-sm text-muted-foreground">
        {dayCount.toLocaleString("fa-IR")} روز
        <span aria-hidden="true"> · </span>
        <span>{created}</span>
      </p>
    </Link>
  );
};

export default WorkoutPlanCard;
