import type { Metadata } from "next";
import { getWorkoutPlanDetail } from "@/features/workout/api/workout-server";
import WorkoutDetailError from "@/features/workout/components/workout-detail-error";
import WorkoutDetailLoading from "@/features/workout/components/workout-detail-loading";
import WorkoutDetailScreen from "@/features/workout/components/workot-detail-screen";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getWorkoutPlanDetail(id);

  return {
    title: data?.name ?? "برنامه جدید",
    description: data?.description ?? "برنامه جدید",
  };
}

const Page = async ({ params }: Props) => {
  const { id } = await params;
  const { isLoading, isError, error, data } = await getWorkoutPlanDetail(id);

  if (isLoading) return <WorkoutDetailLoading />;

  if (isError) return <WorkoutDetailError message={error?.message} />;

  return <WorkoutDetailScreen plan={data} />;
};

export default Page;
