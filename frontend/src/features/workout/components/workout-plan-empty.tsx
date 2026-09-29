import { ClipboardList } from "lucide-react";

const WorkoutPlanEmpty = () => {
  return (
    <section className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-6">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <ClipboardList className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-base font-semibold">هنوز برنامه‌ای نساخته‌ای</h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        با دکمهٔ برنامهٔ جدید، اولین برنامهٔ تمرین را بساز.
      </p>
    </section>
  );
};

export default WorkoutPlanEmpty;
