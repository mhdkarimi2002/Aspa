import { DumbbellIcon } from "lucide-react";
import { WorkoutPlanDayExercise } from "../api/workout-types";
import DayExerciseActions from "./day-exercise-actions";

const DayExercises = ({
  planId,
  dayId,
  exercises,
  split = false,
}: {
  planId: string;
  dayId: string;
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
        <li key={item.id} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-x-2">
              <DumbbellIcon
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="truncate text-sm font-medium">
                {item.exercise.name_fa}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.sets.toLocaleString("fa-IR")} ست
              <span aria-hidden="true"> · </span>
              {formatReps(item.min_reps, item.max_reps)} تکرار
            </p>
          </div>
          <DayExerciseActions planId={planId} dayId={dayId} exercise={item} />
        </li>
      ))}
    </ul>
  );
};

export default DayExercises;
