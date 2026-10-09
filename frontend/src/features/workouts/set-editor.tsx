import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Check, MoreHorizontal } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { Copy, Field, Row } from "../../ui/components";
import { usePalette } from "../../ui/theme";
import { useI18n } from "../../i18n";
import { useOwner } from "../../ui/feature-components";
import { getHistory } from "../api";
import { actualSetFormSchema } from "../contracts";
import { inputNumber } from "../numbers";
import type { DraftSet } from "./model";
export function SetTableHeader() {
  const { t } = useI18n();
  const c = usePalette();
  return (
    <Row style={{ gap: 6 }}>
      <Copy variant="small" style={{ width: 32, color: c.muted }}>
        {t("ست")}
      </Copy>
      {["قبلی", "کیلوگرم", "تکرار"].map((x) => (
        <Copy
          key={x}
          variant="small"
          style={{ flex: 1, textAlign: "center", color: c.muted }}
        >
          {t(x)}
        </Copy>
      ))}
      <View style={{ width: 48 }}>
        <Check size={18} color={c.muted} />
      </View>
    </Row>
  );
}
export function SetEditor({
  set,
  index,
  save,
  disabled,
  exerciseId,
}: {
  set: DraftSet;
  index: number;
  save: (patch: Partial<DraftSet>) => Promise<void>;
  disabled: boolean;
  exerciseId: string | null;
}) {
  const { t } = useI18n();
  const c = usePalette();
  const owner = useOwner();
  const [reps, setReps] = useState(String(set.reps ?? set.target_reps ?? 10));
  const [weight, setWeight] = useState(
    String(set.weight_kg ?? set.target_weight_kg ?? 0),
  );
  const [effort, setEffort] = useState(false);
  const [rpe, setRpe] = useState(set.rpe === null ? "" : String(set.rpe));
  const [rir, setRir] = useState(set.rir === null ? "" : String(set.rir));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const query = useQuery({
    queryKey: ["previous-performance", owner, exerciseId],
    queryFn: ({ signal }) => getHistory(0, exerciseId!, signal),
    enabled: !!owner && !!exerciseId,
    retry: false,
  });
  const previous = query.data?.[0]?.exercises
    .find((e) => e.exercise_id === exerciseId)
    ?.sets.filter((s) => s.completed_at)[index];
  const complete = !!set.completed_at;
  const inputStyle = {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: complete ? c.green : c.surface,
    color: c.text,
    fontFamily: "Vazirmatn",
    fontSize: 16,
    textAlign: "center" as const,
    writingDirection: "ltr" as const,
  };
  const commit = () => {
    setError("");
    const values = actualSetFormSchema.safeParse({
      reps: inputNumber(reps),
      weight: inputNumber(weight),
      rpe: rpe.trim() ? inputNumber(rpe) : null,
      rir: rir.trim() ? inputNumber(rir) : null,
    });
    if (!complete && (!values.success || !reps.trim() || !weight.trim())) {
      setError(
        "تکرار ۰ تا ۱۰۰۰، وزن ۰ تا ۱۰۰۰، RPE تا ۱۰ و RIR تا ۲۰ وارد کنید.",
      );
      return;
    }
    setPending(true);
    const patch = complete
      ? { completed_at: null }
      : values.success
        ? {
            reps: values.data.reps,
            weight_kg: values.data.weight,
            rpe: values.data.rpe,
            rir: values.data.rir,
            completed_at: new Date().toISOString(),
          }
        : {};
    void save(patch)
      .catch(() =>
        setError("ذخیره روی دستگاه ممکن نشد. فضای ذخیره‌سازی را بررسی کنید."),
      )
      .finally(() => setPending(false));
  };
  return (
    <View style={{ gap: 8 }}>
      <Row style={{ gap: 6 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t("RPE/RIR (اختیاری)")} ${index + 1}`}
          accessibilityState={{ expanded: effort }}
          hitSlop={{ left: 8, right: 8 }}
          onPress={() => setEffort(!effort)}
          style={{
            width: 32,
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Copy>{index + 1}</Copy>
          <MoreHorizontal size={12} color={c.muted} />
        </Pressable>
        <Copy
          variant="small"
          style={{
            flex: 1,
            textAlign: "center",
            writingDirection: "ltr",
            color: c.muted,
          }}
        >
          {previous ? `${previous.weight_kg} × ${previous.reps}` : "—"}
        </Copy>
        <TextInput
          accessibilityLabel={`${t("وزن واقعی (کیلوگرم)")} ${index + 1}`}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          editable={!disabled && !pending && !complete}
          style={inputStyle}
        />
        <TextInput
          accessibilityLabel={`${t("تکرار واقعی")} ${index + 1}`}
          value={reps}
          onChangeText={setReps}
          keyboardType="number-pad"
          editable={!disabled && !pending && !complete}
          style={inputStyle}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t(complete ? "اصلاح ست" : "ثبت ست")} ${index + 1}`}
          accessibilityState={{
            disabled: disabled || pending,
            busy: pending,
            selected: complete,
          }}
          disabled={disabled || pending}
          onPress={commit}
          style={({ pressed }) => ({
            minHeight: 48,
            width: 48,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: complete ? c.green : c.blue,
            opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
          })}
        >
          {complete ? (
            <Check size={20} color={c.primary} />
          ) : (
            <Check size={20} color={c.primary} />
          )}
        </Pressable>
      </Row>
      {effort && (
        <View style={{ gap: 8 }}>
          <Copy variant="small">
            {t("RPE شدت ۰ تا ۱۰ است؛ RIR تکرار باقی‌مانده ۰ تا ۲۰ است.")}
          </Copy>
          <Row>
            <View style={{ flex: 1 }}>
              <Field
                label={`RPE ${index + 1}`}
                value={rpe}
                onChangeText={setRpe}
                keyboardType="decimal-pad"
                editable={!disabled && !complete}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={`RIR ${index + 1}`}
                value={rir}
                onChangeText={setRir}
                keyboardType="number-pad"
                editable={!disabled && !complete}
              />
            </View>
          </Row>
        </View>
      )}
      {error && <Copy accessibilityRole="alert">{t(error)}</Copy>}
    </View>
  );
}
