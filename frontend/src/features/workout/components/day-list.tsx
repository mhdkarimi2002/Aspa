import { Edit, Edit2 } from "lucide-react";
import { WorkoutPlanDay } from "../api/workout-types";
import DayExercises from "./day-exercies";
import AddExerciesDialog from "./workout-detail/add-exercies-dialog";
import { Button } from "@/components/ui/button";

interface Props {
  days: WorkoutPlanDay[];
}

const sizes = [
  "sm:col-span-2 lg:col-span-4",
  "lg:col-span-2",
  "sm:col-span-2 lg:col-span-3",
  "lg:col-span-2",
  "lg:col-span-1",
  "sm:col-span-2 lg:col-span-3",
  "sm:col-span-3 lg:col-span-3",
  "lg:col-span-2",
  "sm:col-span-2 lg:col-span-4",
];

const DaysList = ({ days }: Props) => {
  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {days.map((day, index) => {
        const size = sizes[index % sizes.length];
        const wide =
          size.includes("lg:col-span-4") || size.includes("lg:col-span-3");

        return (
          <li key={day.id} className={size}>
            <article className="flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-x-2">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
                    {(index + 1).toLocaleString("fa-IR")}
                  </span>
                  <h2 className="text-base font-semibold">{day.name}</h2>
                </div>
                <div className="flex items-center gap-0.5">
                  <AddExerciesDialog dayId={day.id} />
                  <Button variant="link" size={"icon-sm"} type="button">
                    <Edit2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="mt-auto">
                <DayExercises exercises={day.exercises} split={wide} />
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
};

export default DaysList;
