"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useThemeStore } from "@/stores/theme.store";
import type { MusclePanelState } from "../../hooks/use-select-exercies";

const copy = {
  fa: { title: "عضله", retry: "تلاش دوباره" },
  en: { title: "Muscle", retry: "Try again" },
} as const;

const MusclePicker = ({
  panel,
  onSelect,
}: {
  panel: MusclePanelState;
  onSelect: (id: string) => void;
}) => {
  const texts = copy[useThemeStore((state) => state.language)];

  return (
  <section className="flex shrink-0 flex-col gap-2">
    <h2 className="text-sm font-medium">{texts.title}</h2>
    {panel.status === "loading" ? (
      <ul className="flex gap-2" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index}>
            <Skeleton className="h-11 w-24 rounded-full" />
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
          {texts.retry}
        </Button>
      </div>
    ) : null}
    {panel.status === "ready" && panel.items.length > 0 ? (
      <ul className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {panel.items.map((item) => (
          <li key={item.id} className="shrink-0">
            <button
              type="button"
              aria-pressed={item.selected}
              className={chipClassName(item.selected)}
              onClick={() => onSelect(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    ) : null}
  </section>
  );
};

function chipClassName(selected: boolean) {
  const state = selected
    ? "border-primary bg-primary text-primary-foreground"
    : "border-border bg-card hover:bg-muted";

  return `inline-flex h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring ${state}`;
}

export default MusclePicker;
