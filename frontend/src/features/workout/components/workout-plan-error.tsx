"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  message: string;
  pending: boolean;
  onRetry: () => void;
}

const WorkoutPlanError = ({ message, pending, onRetry }: Props) => {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium">برنامه‌ها بارگذاری نشد</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-11"
        disabled={pending}
        onClick={onRetry}
      >
        {pending ? "در حال تلاش دوباره" : "تلاش دوباره"}
      </Button>
    </div>
  );
};

export default WorkoutPlanError;
