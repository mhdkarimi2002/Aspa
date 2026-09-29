"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkoutDetailFrame from "./workout-detail-frame";

const WorkoutDetailError = ({ message }: { message?: string }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <WorkoutDetailFrame>
      <div
        role="alert"
        className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-base font-medium">برنامه بارگذاری نشد</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {detailErrorMessage(message)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          disabled={pending}
          onClick={() => {
            startTransition(() => router.refresh());
          }}
        >
          {pending ? "در حال تلاش دوباره" : "تلاش دوباره"}
        </Button>
      </div>
    </WorkoutDetailFrame>
  );
};

function detailErrorMessage(message?: string) {
  if (message === "Unauthorized") return "برای دیدن این برنامه باید وارد شوی.";
  if (message === "Not Found") return "این برنامه پیدا نشد.";
  return message || "دوباره تلاش کن.";
}

export default WorkoutDetailError;
