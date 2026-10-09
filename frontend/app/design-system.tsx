import { useI18n } from "../src/i18n";
import { useCallback, useState } from "react";
import { router } from "expo-router";
import { View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Layers } from "lucide-react-native";
import {
  Screen,
  Surface,
  Copy,
  Button,
  Field,
  Dialog,
  EmptyState,
  LoadingState,
  ErrorState,
} from "../src/ui/components";
import { usePalette } from "../src/ui/theme";
const schema = z.object({
  name: z.string().trim().min(2, "نام باید دست‌کم دو حرف داشته باشد."),
});
export default function Gallery() {
  const c = usePalette();
  const { t, language } = useI18n();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const [saved, setSaved] = useState("");
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });
  return (
    <Screen>
      <Button
        label={t("بازگشت")}
        secondary
        icon={language === "fa" ? ArrowRight : ArrowLeft}
        onPress={() => router.replace("/profile")}
      />
      <Copy variant="display">{t("اجزای رابط")}</Copy>
      <Copy style={{ color: c.muted }}>
        {t("پیش‌نمایش طراحی؛ اطلاعات این فرم فقط برای نمایش است.")}
      </Copy>
      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        {[c.blue, c.pink, c.green, c.purple, c.yellow].map((color) => (
          <View
            key={color}
            style={{
              width: 52,
              height: 52,
              backgroundColor: color,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: c.border,
            }}
          />
        ))}
      </View>
      <Surface style={{ gap: 16 }}>
        <Copy variant="title">{t("سطح برجسته و فرم")}</Copy>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field
              label={t("نام نمایشی")}
              placeholder={t("نام شما")}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Button
          label={t("بررسی فرم")}
          onPress={handleSubmit(({ name }) => setSaved(name))}
        />
        {saved && (
          <Copy accessibilityRole="alert" style={{ color: c.success }}>
            {saved === "__retry"
              ? t("تلاش دوباره در پیش‌نمایش انجام شد.")
              : t("فرم برای «{name}» معتبر است.", { name: saved })}
          </Copy>
        )}
        <Button
          label={t("نمایش پنجره")}
          secondary
          onPress={() => setOpen(true)}
        />
        <Button label={t("دکمه غیرفعال")} disabled onPress={() => {}} />
      </Surface>
      <Surface inset>
        <Copy>{t("سطح فرورفته با سایه‌های ملایم")}</Copy>
      </Surface>
      <LoadingState />
      <ErrorState retry={() => setSaved("__retry")} />
      <EmptyState
        icon={Layers}
        title={t("هنوز چیزی اینجا نیست")}
        description={t("حالت خالی با توضیح روشن و خوانا.")}
      />
      <Dialog visible={open} onClose={close} />
    </Screen>
  );
}
