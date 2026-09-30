import type { GetWorkoutPlanDetailResponse } from "../../api/workout-types";
import MissingPlan from "./missing-plan";
import PlanDetail from "./plan-detail";
import WorkoutDetailFrame from "./workout-detail-frame";

interface Props {
  plan: GetWorkoutPlanDetailResponse | null | undefined;
}

const WorkoutDetailScreen = ({ plan }: Props) => {
  return (
    <WorkoutDetailFrame>
      {plan ? <PlanDetail plan={plan} /> : <MissingPlan />}
    </WorkoutDetailFrame>
  );
};

export default WorkoutDetailScreen;
