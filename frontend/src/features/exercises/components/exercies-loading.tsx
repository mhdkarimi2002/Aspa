import { Skeleton } from "@/components/ui/skeleton";

function ExerciseListSkeleton() {
  return (
    <ul
      aria-busy="true"
      aria-label="در حال بارگذاری تمرین‌ها"
      className="grid gap-3 sm:grid-cols-2"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <li
          key={index}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </li>
      ))}
    </ul>
  );
}
export default ExerciseListSkeleton;
