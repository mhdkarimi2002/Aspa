"use client";

import { getApiErrorMessage } from "@/shared/api/error";
import { useWorkoutPlans } from "../api/workout-query";
import WorkoutPlanEmpty from "./workout-plan-empty";
import WorkoutPlanError from "./workout-plan-error";
import WorkoutPlansLoading from "./workout-plans-loading";
import WorkoutPlanCard from "./workout-plan-card";
import CreateWorkoutPlanDialog from "./create-workout-plan-dialog";

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

const WorkoutPlansList = () => {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useWorkoutPlans();
  const plans = data ?? [];

  return (
    <section aria-label="برنامه‌های تمرین" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "در حال خواندن برنامه‌ها"
            : `${plans.length.toLocaleString("fa-IR")} برنامه`}
        </p>
        <CreateWorkoutPlanDialog />
      </div>

      {/* Loading state */}
      {isLoading ? <WorkoutPlansLoading /> : null}

      {/* Error state */}
      {isError ? (
        <WorkoutPlanError
          message={getApiErrorMessage(error)}
          pending={isRefetching}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {/* Empty state */}
      {!isLoading && !isError && plans.length === 0 ? (
        <WorkoutPlanEmpty />
      ) : null}

      {/* Success state */}
      {!isLoading && !isError && plans.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {plans.map((plan, index) => (
            <li key={plan.id} className={sizes[index % sizes.length]}>
              <WorkoutPlanCard plan={plan} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};

export default WorkoutPlansList;
