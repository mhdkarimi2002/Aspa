import AppHeader from "@/components/shared/app-header";
import ExerciseListSkeleton from "./exercies-loading";
import ExerciseList from "./exerices-list";
import { Suspense } from "react";
import MuscleGroupLoading from "./muscle-group-loading";
import MuscleGroupList from "./muscle-group-list";

interface Props {
  muscleGroupId?: string;
}

const ExercisesScreen = ({ muscleGroupId }: Props) => {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main
        id="main"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-6"
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">حرکت‌ها</p>
          <h1 className="text-3xl font-semibold">تمرین‌ها</h1>
        </div>

        <Suspense fallback={<MuscleGroupLoading />}>
          <MuscleGroupList selectedId={muscleGroupId} />
        </Suspense>

        <Suspense fallback={<ExerciseListSkeleton />}>
          <ExerciseList muscleGroupId={muscleGroupId} />
        </Suspense>
      </main>
    </div>
  );
};

export default ExercisesScreen;
