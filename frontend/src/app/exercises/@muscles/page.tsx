import ExerciseListSkeleton from "@/features/exercises/components/exercies-loading";
import ExerciseList from "@/features/exercises/components/exerices-list";
import MuscleGroupList from "@/features/exercises/components/muscle-group-list";
import MuscleGroupLoading from "@/features/exercises/components/muscle-group-loading";
import { Suspense } from "react";

const MusclesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ muscle?: string }>;
}) => {
  const { muscle } = await searchParams;

  return (
    <>
      <Suspense fallback={<MuscleGroupLoading />}>
        <MuscleGroupList selectedId={muscle} />
      </Suspense>
      <Suspense fallback={<ExerciseListSkeleton />}>
        <ExerciseList muscleGroupId={muscle} />
      </Suspense>
    </>
  );
};

export default MusclesPage;
