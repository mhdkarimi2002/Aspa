import type { ReactNode } from "react";
import Header from "@/components/shared/header";

const WorkoutDetailFrame = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main
        id="main"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-6"
      >
        {children}
      </main>
    </div>
  );
};

export default WorkoutDetailFrame;
