import { Edit, Edit2 } from "lucide-react";
import { WorkoutPlanDay } from "../api/workout-types";
import DayExercises from "./day-exercies";
import AddExerciesDialog from "./workout-detail/add-exercies-dialog";
import { Button } from "@/components/ui/button";

interface Props {
  planId: string;
  days: WorkoutPlanDay[];
}

const DaysList = ({ planId, days }: Props) => {
  return (
    <ol className="columns-1 gap-3 sm:columns-2 lg:columns-3">
      {days.map((day, index) => {
        return (
          <li key={day.id} className="mb-3 break-inside-avoid">
            <article className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4">
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

              <div>
                <DayExercises
                  planId={planId}
                  dayId={day.id}
                  exercises={day.exercises}
                />
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
};

export default DaysList;
