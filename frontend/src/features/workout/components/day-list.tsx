import { WorkoutPlanDay } from "../api/workout-types";
import DayExercises from "./day-exercies";

interface Props {
  days: WorkoutPlanDay[];
}
const DaysList = ({ days }: Props) => {
  return (
    <ol className="flex flex-col gap-3">
      {days.map((day, index) => (
        <li
          key={day.id}
          className="grid grid-cols-[4.5rem_1fr] overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="flex items-center justify-center bg-primary text-primary-foreground">
            <span className="text-2xl font-semibold">
              {(index + 1).toLocaleString("fa-IR")}
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{day.name}</h2>
              <p className="rounded-full bg-primary/15 px-3 py-1 text-sm text-primary">
                {day.exercises.length.toLocaleString("fa-IR")} حرکت
              </p>
            </div>
            <DayExercises exercises={day.exercises} />
          </div>
        </li>
      ))}
    </ol>
  );
};

export default DaysList;
