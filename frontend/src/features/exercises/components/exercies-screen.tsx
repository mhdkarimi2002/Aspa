import AppHeader from "@/components/shared/app-header";
import { getLocale } from "@/shared/i18n/get-locale";
import { Suspense, type ReactNode } from "react";
import ExerciseTabs from "./exercise-tabs";

const copy = {
  fa: {
    eyebrow: "حرکت‌ها",
    title: "تمرین‌ها",
    muscles: "عضلات",
    equipment: "تجهیزات",
  },
  en: {
    eyebrow: "Movements",
    title: "Exercises",
    muscles: "Muscles",
    equipment: "Equipment",
  },
} as const;

const ExercisesScreen = async ({
  muscles,
  equipment,
}: {
  muscles: ReactNode;
  equipment: ReactNode;
}) => {
  const text = copy[await getLocale()];

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

        <Suspense>
          <ExerciseTabs
            muscles={muscles}
            equipment={equipment}
            musclesLabel={text.muscles}
            equipmentLabel={text.equipment}
          />
        </Suspense>
      </main>
    </div>
  );
};

export default ExercisesScreen;
