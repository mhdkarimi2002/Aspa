"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

function ExerciseError({ message }: { message: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-6"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium">تمرین‌ها بارگذاری نشد</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {message}
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
  );
}

export default ExerciseError;
