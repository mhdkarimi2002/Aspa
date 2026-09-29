import AppHeader from "@/components/shared/app-header";
import { getLocale } from "@/shared/i18n/get-locale";
import WorkoutPlansList from "./workout-plans-list";

const copy = {
  fa: {
    eyebrow: "برنامه‌ها",
    title: "برنامه‌های من",
  },
  en: {
    eyebrow: "Plans",
    title: "My workouts",
  },
} as const;

const WorkoutScreen = async () => {
  const locale = await getLocale();
  const text = copy[locale];

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main
        id="main"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-6"
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">{text.eyebrow}</p>
          <h1 className="text-3xl font-semibold">{text.title}</h1>
        </div>

        <WorkoutPlansList />
      </main>
    </div>
  );
};

export default WorkoutScreen;
