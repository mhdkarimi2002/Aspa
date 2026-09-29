import WorkoutScreen from "@/features/workout/components/workout-screen";
import { Metadata } from "next";

const metadata: Metadata = {
  title: "Workout - ASPA",
  description: "Workout page for ASPA",
  keywords: ["workout", "fitness", "exercise", "aspa"],
};

const WorkoutPage = () => {
  return <WorkoutScreen />;
};

export default WorkoutPage;
