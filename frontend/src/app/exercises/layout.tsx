import ExercisesScreen from "@/features/exercises/components/exercies-screen";

const ExercisesLayout = ({
  muscles,
  equipment,
}: {
  children: React.ReactNode;
  muscles: React.ReactNode;
  equipment: React.ReactNode;
}) => {
  return <ExercisesScreen muscles={muscles} equipment={equipment} />;
};

export default ExercisesLayout;
