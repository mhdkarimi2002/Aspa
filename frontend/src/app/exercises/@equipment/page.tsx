import EquipmentList from "@/features/exercises/components/equipment-list";
import ExerciseList from "@/features/exercises/components/exerices-list";
import ExerciseListSkeleton from "@/features/exercises/components/exercies-loading";
import MuscleGroupLoading from "@/features/exercises/components/muscle-group-loading";
import { Suspense } from "react";

const EquipmentPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ equipment?: string }>;
}) => {
  const { equipment } = await searchParams;

  return (
    <>
      <Suspense fallback={<MuscleGroupLoading />}>
        <EquipmentList selectedId={equipment} />
      </Suspense>
      <Suspense fallback={<ExerciseListSkeleton />}>
        <ExerciseList equipmentId={equipment} />
      </Suspense>
    </>
  );
};

export default EquipmentPage;
