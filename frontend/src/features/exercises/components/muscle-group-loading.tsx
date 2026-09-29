import { Skeleton } from "@/components/ui/skeleton";

const MuscleGroupLoading = () => {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <Skeleton className="h-5 w-24" />
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
        <ul className="flex w-max flex-nowrap gap-2 md:w-auto md:flex-wrap">
        {Array.from({ length: 8 }).map((_, index) => (
          <li key={index}>
            <Skeleton className="h-11 w-24 rounded-md" />
          </li>
        ))}
        </ul>
      </div>
    </div>
  );
};

export default MuscleGroupLoading;
