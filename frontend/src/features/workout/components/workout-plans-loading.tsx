import { Skeleton } from "@/components/ui/skeleton";

const sizes = [
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "",
  "",
  "lg:col-span-2",
];

const WorkoutPlansLoading = () => {
  return (
    <ul
      aria-busy="true"
      aria-label="در حال بارگذاری برنامه‌ها"
      className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {sizes.map((size, index) => (
        <li
          key={index}
          className={`flex flex-col gap-4 self-start rounded-2xl border border-border bg-card p-4 ${size}`}
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
