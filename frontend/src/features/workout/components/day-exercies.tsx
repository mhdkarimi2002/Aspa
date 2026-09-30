import { DumbbellIcon } from "lucide-react";
import { WorkoutPlanDayExercise } from "../api/workout-types";

const DayExercises = ({
  exercises,
  split = false,
}: {
  exercises: WorkoutPlanDayExercise[];
  split?: boolean;
}) => {
  const items = [...exercises].sort((a, b) => a.position - b.position);

  function formatReps(min: number, max: number) {
    if (min === max) return min.toLocaleString("fa-IR");
    return `${min.toLocaleString("fa-IR")}–${max.toLocaleString("fa-IR")}`;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        هنوز حرکتی در این روز نیست
      </p>
    );
  }

  return (
    <ul
      className={`gap-2 border-t border-border pt-3 ${split ? "grid sm:grid-cols-1" : "flex flex-col"}`}
    >
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
        >
          <div className="flex items-center gap-x-2">
            <DumbbellIcon className="size-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium">{item.exercise.name_fa}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {item.sets.toLocaleString("fa-IR")} ست
            <span aria-hidden="true"> · </span>
            {formatReps(item.min_reps, item.max_reps)} تکرار
          </span>
        </li>
      ))}
    </ul>
  );
};

export default DayExercises;
