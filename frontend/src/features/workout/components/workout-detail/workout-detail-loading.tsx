import { Skeleton } from "@/components/ui/skeleton";
import WorkoutDetailFrame from "./workout-detail-frame";

const WorkoutDetailLoading = () => {
  return (
    <WorkoutDetailFrame>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <section aria-busy="true" aria-label="در حال بارگذاری برنامه" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-11 w-28 rounded-md" />
        </div>
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 2 }, (_, index) => (
            <li
              key={index}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 shrink-0 rounded-2xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </WorkoutDetailFrame>
  );
};

export default WorkoutDetailLoading;
