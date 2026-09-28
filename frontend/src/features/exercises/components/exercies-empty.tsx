import { Dumbbell } from "lucide-react";

function ExerciseEmpty() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-card px-6 py-16 text-center">
      <div className="h-1 w-16 rounded-full bg-primary" aria-hidden="true" />
      <div className="relative mt-8 flex size-28 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-primary/10"
          aria-hidden="true"
        />
        <span
          className="absolute inset-3 rounded-full border border-primary/40"
          aria-hidden="true"
        />
        <span className="relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Dumbbell className="size-8" aria-hidden="true" />
        </span>
      </div>
      <h2 className="mt-8 text-2xl font-semibold">فهرست خالی است</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground text-center!">
        هنوز حرکتی ثبت نشده. تمرین‌ها که اضافه شوند، همین‌جا می‌آیند.
      </p>
    </section>
  );
}
export default ExerciseEmpty;
