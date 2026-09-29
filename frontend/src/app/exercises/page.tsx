import ExercisesScreen from "@/features/exercises/components/exercies-screen";

interface Props {
  searchParams: Promise<{ muscle?: string }>;
}

const ExercisesPage = async ({ searchParams }: Props) => {
  const { muscle } = await searchParams;

  return <ExercisesScreen muscleGroupId={muscle} />;
};

export default ExercisesPage;
