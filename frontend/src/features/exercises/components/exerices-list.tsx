import { getApiErrorMessage } from "@/shared/api/error";
import ExerciseError from "./exercies-error";
import ExerciseBento from "./exercise-bento";
import { getExercisesServer } from "../api/exercies-server";

interface Props {
  muscleGroupId?: string;
  equipmentId?: string;
}

const ExerciseList = async ({ muscleGroupId, equipmentId }: Props) => {
  const { isError, error, data } = await getExercisesServer({
    muscleGroupId,
    equipmentId,
  });
  const exercises = data ?? [];

  if (isError) {
    return <ExerciseError message={getApiErrorMessage(error)} />;
  }

  if (exercises.length === 0) {
    return (
      <section>
        <p className="text-sm text-muted-foreground">
          {muscleGroupId
            ? "حرکتی برای این گروه عضلانی نیست."
            : equipmentId
              ? "حرکتی برای این تجهیزات نیست."
              : "هنوز حرکتی ثبت نشده."}
        </p>
      </section>
    );
  }

  return (
    <section aria-label="فهرست تمرین‌ها">
      <ExerciseBento exercises={exercises} />
    </section>
  );
};

export default ExerciseList;
