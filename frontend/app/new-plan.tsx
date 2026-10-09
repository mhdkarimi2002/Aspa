import { useState } from "react";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Screen, Copy, Field, Button, Surface } from "../src/ui/components";
import {
  BackButton,
  FeatureError,
  SignInGate,
  useOwner,
} from "../src/ui/feature-components";
import { planWrite } from "../src/features/api";
import { planFormSchema } from "../src/features/contracts";
import { useI18n } from "../src/i18n";
export default function NewPlan() {
  const { t } = useI18n();
  const owner = useOwner();
  const cache = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      const body = planFormSchema.parse({ name, description });
      return planWrite(undefined, { method: "POST", body });
    },
    onSuccess: (plan) => {
      void cache.invalidateQueries({ queryKey: ["plans", owner] });
      router.replace({ pathname: "/plan", params: { id: plan.id, edit: "1" } });
    },
  });
  return (
    <Screen>
      <Copy variant="title">{t("روتین جدید")}</Copy>
      {owner ? (
        <Surface style={{ gap: 16 }}>
          <Field
            label={t("نام روتین")}
            value={name}
            maxLength={120}
            onChangeText={setName}
            error={error}
          />
          <Field
            label={t("توضیحات")}
            value={description}
            maxLength={2000}
            multiline
            onChangeText={setDescription}
          />
          {mutation.isError && <FeatureError error={mutation.error} />}
          <Button
            label={t("روتین جدید")}
            loading={mutation.isPending}
            onPress={() => {
              if (!name.trim()) {
                setError("نام برنامه را وارد کنید.");
                return;
              }
              setError("");
              mutation.mutate();
            }}
          />
        </Surface>
      ) : (
        <SignInGate />
      )}
      <BackButton />
    </Screen>
  );
}
