import { useState } from "react";
import { router } from "expo-router";
import { Button } from "../../ui/components";
import { FeatureError } from "../../ui/feature-components";
import { useWorkouts } from "./provider";
import { useI18n } from "../../i18n";
import type { Plan, WorkoutRun } from "../contracts";
export function StartWorkoutButton({
  plan,
  run,
  label,
  secondary = false,
}: {
  plan?: Plan;
  run?: WorkoutRun;
  label: string;
  secondary?: boolean;
}) {
  const { t } = useI18n();
  const workouts = useWorkouts();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  return (
    <>
      <Button
        label={t(label)}
        secondary={secondary}
        loading={pending}
        disabled={
          !workouts.loaded ||
          workouts.storageError ||
          !!plan?.is_archived ||
          (!!plan && !plan.exercises.length)
        }
        onPress={() => {
          setPending(true);
          setError(null);
          void (async () => {
            const engine = workouts.engine!;
            await engine.restoreActive();
            const active = engine
              .getSnapshot()
              .entries.find((e) => e.document.status === "in_progress");
            const client =
              active?.document.client_id ?? (await engine.create(plan, run));
            void engine.flush();
            router.push({ pathname: "/workout", params: { client } });
          })()
            .catch(setError)
            .finally(() => setPending(false));
        }}
      />
      {!!error && <FeatureError error={error} />}
    </>
  );
}
