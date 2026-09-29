import Header from "@/components/shared/header";
import WorkoutPlansList from "./workout-plans-list";

const WorkoutScreen = () => {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main
        id="main"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-6"
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">برنامه‌ها</p>
          <h1 className="text-3xl font-semibold">برنامه‌های من</h1>
        </div>

        <WorkoutPlansList />
      </main>
    </div>
  );
};

export default WorkoutScreen;
