import { Skeleton } from "@/components/ui/skeleton";

const spans = [
  "lg:col-span-2 lg:row-span-2 lg:min-h-72",
  "lg:col-span-2 lg:row-span-2 lg:min-h-72",
  "lg:col-span-2",
  "",
  "",
  "lg:col-span-2",
];

function ExerciseListSkeleton() {
  return (
    <ul
      aria-busy="true"
      aria-label="در حال بارگذاری تمرین‌ها"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {spans.map((span, index) => (
        <li
          key={index}
          className={`flex min-h-44 flex-col gap-4 rounded-2xl border border-border bg-card p-4 ${span}`}
        >
          <Skeleton className="size-11 rounded-2xl" />
          <div className="mt-auto flex flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-7 w-16 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

export default ExerciseListSkeleton;
