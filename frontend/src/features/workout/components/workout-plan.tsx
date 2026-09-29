import { ClipboardList } from "lucide-react";
import { WorkoutPlan } from "../api/workout-types";

const WorkoutPlanCard = ({ plan }: { plan: WorkoutPlan }) => {
  const dateFormat = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" });

  const created = dateFormat.format(new Date(plan.created_at));
  const dayCount = plan.days.length;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <ClipboardList className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{plan.name}</h2>
        {plan.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {plan.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">بدون توضیح</p>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {dayCount.toLocaleString("fa-IR")} روز
        <span aria-hidden="true"> · </span>
        <span>{created}</span>
      </p>
    </li>
  );
};

export default WorkoutPlanCard;
