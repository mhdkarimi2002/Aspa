import { Skeleton } from "@/components/ui/skeleton";

const WorkoutPlansLoading = () => {
  return (
    <ul
      aria-busy="true"
      aria-label="در حال بارگذاری برنامه‌ها"
      className="grid gap-3 sm:grid-cols-2"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <li
          key={index}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4"
        >
          <Skeleton className="size-11 rounded-2xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default WorkoutPlansLoading;
