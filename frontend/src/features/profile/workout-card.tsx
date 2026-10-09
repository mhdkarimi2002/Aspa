import { router } from "expo-router";
import { Copy, Surface, Button, Row } from "../../ui/components";
import { Avatar } from "../../ui/profile-components";
import { useSession } from "../../auth/session";
import { useI18n } from "../../i18n";
import type { WorkoutRun } from "../contracts";
export function WorkoutCard({ run }: { run: WorkoutRun }) {
  const { t, language } = useI18n();
  const user = useSession((s) => s.user);
  const volume = run.exercises
    .flatMap((e) => e.sets)
    .filter((s) => s.completed_at)
    .reduce((n, s) => n + (s.reps ?? 0) * (s.weight_kg ?? 0), 0);
  return (
    <Surface style={{ gap: 12 }}>
      <Row>
        <Avatar uri={user?.avatar} size={44} />
        <Copy style={{ flex: 1 }}>
          {user?.username ?? user?.name ?? t("تمرین من")}
        </Copy>
      </Row>
      <Copy variant="small">
        {new Date(run.completed_at ?? run.started_at).toLocaleDateString(
          language === "fa" ? "fa-IR" : "en-US",
          { weekday: "long", year: "numeric", month: "short", day: "numeric" },
        )}
      </Copy>
      <Copy variant="title">{run.plan_name}</Copy>
      <Copy>
        {Math.round((run.duration_seconds ?? 0) / 60)} {t("دقیقه")} ·{" "}
        {volume.toLocaleString(language)} {t("کیلوگرم")}
      </Copy>
      {run.exercises.slice(0, 3).map((e) => (
        <Copy key={e.id} variant="small">
          {e.sets.filter((s) => s.completed_at).length} {t("ست")} · {e.name_fa}
        </Copy>
      ))}
      <Button
        label={t("مشاهده تمرین")}
        secondary
        onPress={() =>
          router.push({ pathname: "/workout-summary", params: { id: run.id } })
        }
      />
    </Surface>
  );
}
