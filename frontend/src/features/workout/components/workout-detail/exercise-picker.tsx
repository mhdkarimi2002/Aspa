"use client";

import { Check, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExercisePanelState } from "../../hooks/use-select-exercies";

const ExercisePicker = ({
  panel,
  onSelect,
}: {
  panel: ExercisePanelState;
  onSelect: (id: string) => void;
}) => (
  <section className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
    <h2 className="text-sm font-medium">حرکت</h2>
    {panel.status === "idle" ? (
      <div className="flex flex-1 flex-col items-start justify-center gap-3 rounded-2xl border border-dashed border-border px-4 py-8">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Dumbbell className="size-5" aria-hidden="true" />
        </span>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          یک عضله را انتخاب کن تا حرکت‌هایش همین‌جا بیاید.
        </p>
      </div>
    ) : null}
    {panel.status === "loading" ? (
      <ul className="flex flex-col gap-2" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index}>
            <Skeleton className="h-16 w-full rounded-2xl" />
          </li>
        ))}
      </ul>
    ) : null}
    {panel.status === "error" ? (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-destructive">{panel.message}</p>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={panel.onRetry}
        >
          تلاش دوباره
        </Button>
      </div>
    ) : null}
    {panel.status === "empty" ? (
      <p className="rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
        حرکتی برای این عضله نیست.
      </p>
    ) : null}
    {panel.status === "ready" ? (
      <ul className="flex max-h-[min(18rem,45dvh)] flex-col gap-2 overflow-y-auto overscroll-contain">
        {panel.items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-pressed={item.selected}
              className={cardClassName(item.selected)}
              onClick={() => onSelect(item.id)}
            >
              <span className={iconClassName(item.selected)}>
                {item.selected ? (
                  <Check className="size-5" aria-hidden="true" />
                ) : (
                  <Dumbbell className="size-5" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {item.title}
                </span>
                <span
                  className="block truncate text-sm text-muted-foreground"
                  dir="ltr"
                >
                  {item.subtitle}
                </span>
              </span>
              <span className="max-w-24 shrink truncate rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                {item.difficulty}
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : null}
  </section>
);

function cardClassName(selected: boolean) {
  const state = selected
    ? "border-primary bg-primary/10"
    : "border-border bg-card hover:bg-muted";

  return `flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border p-3 text-start outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring ${state}`;
}

function iconClassName(selected: boolean) {
  const state = selected
    ? "bg-primary text-primary-foreground"
    : "bg-muted text-muted-foreground";

  return `flex size-11 shrink-0 items-center justify-center rounded-xl ${state}`;
}

export default ExercisePicker;
