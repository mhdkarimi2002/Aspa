"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { getApiErrorMessage } from "@/shared/api/error";
import { useWorkoutPlans } from "../api/workout-query";
import WorkoutPlanEmpty from "./workout-plan-empty";
import WorkoutPlanError from "./workout-plan-error";
import WorkoutPlansLoading from "./workout-plans-loading";
import WorkoutPlanCard from "./workout-plan";
import CreateWorkoutPlanDialog from "./create-workout-plan-dialog";

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
        <ul className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => (
            <WorkoutPlanCard key={plan.id} plan={plan} />
          ))}
        </ul>
      ) : null}
    </section>
  );
};

export default WorkoutPlansList;
