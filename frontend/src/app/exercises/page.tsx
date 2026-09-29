const ExercisesPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ muscle?: string }>;
}) => {
  await searchParams;
  return null;
};

export default ExercisesPage;
