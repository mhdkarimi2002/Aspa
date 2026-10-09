import { useCallback, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Check } from "lucide-react-native";
import { uploadProfilePhoto } from "../../auth/service";
import { BottomSheet } from "../../ui/bottom-sheet";
import { Button, Copy, Row } from "../../ui/components";
import { usePalette } from "../../ui/theme";
import { useI18n } from "../../i18n";
import { useSession } from "../../auth/session";
import type { User } from "../../auth/schemas";
const genders = [
  { value: "male", label: "مرد" },
  { value: "female", label: "زن" },
  { value: "prefer_not_to_say", label: "ترجیح می‌دهم نگویم" },
] as const;
export function GenderPicker({
  value,
  onChange,
  disabled,
}: {
  value: NonNullable<User["gender"]>;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const { t } = useI18n();
  const c = usePalette();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t("جنسیت")}
        aria-haspopup="dialog"
        accessibilityState={{ expanded: open, disabled }}
        onPress={() => setOpen(true)}
        style={{ minHeight: 48, justifyContent: "center" }}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <Copy>{t("جنسیت")}</Copy>
          <Copy style={{ color: c.primary }}>
            {t(
              genders.find((g) => g.value === value)?.label ??
                "ترجیح می‌دهم نگویم",
            )}
          </Copy>
        </Row>
      </Pressable>
      <BottomSheet open={open} title="جنسیت" onClose={close}>
        {genders.map((g) => (
          <Pressable
            key={g.value}
            accessibilityRole="radio"
            accessibilityLabel={t(g.label)}
            accessibilityState={{ checked: value === g.value }}
            onPress={() => {
              onChange(g.value);
              close();
            }}
            style={{
              minHeight: 48,
              paddingHorizontal: 10,
              justifyContent: "center",
              backgroundColor: value === g.value ? c.blue : "transparent",
              borderRadius: 8,
            }}
          >
            <Row style={{ justifyContent: "space-between" }}>
              <Copy>{t(g.label)}</Copy>
              {value === g.value && <Check size={18} color={c.primary} />}
            </Row>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  );
}
export function PicturePicker({
  onChange,
  disabled,
  onBusy,
}: {
  onChange: (value: string) => void;
  disabled: boolean;
  onBusy: (value: boolean) => void;
}) {
  const { t } = useI18n();
  const c = usePalette();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const choose = async (camera: boolean) => {
    close();
    setError(null);
    setBusy(true);
    onBusy(true);
    const owner = useSession.getState().user?.id;
    try {
      if (camera && Platform.OS !== "web") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError("برای گرفتن عکس، دسترسی دوربین را فعال کنید.");
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      };
      const result = await (camera
        ? ImagePicker.launchCameraAsync(options)
        : ImagePicker.launchImageLibraryAsync(options));
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if ((asset.fileSize ?? 0) > 5 * 1024 * 1024) {
        setError("عکس باید کمتر از ۵ مگابایت باشد.");
        return;
      }
      if (!asset.base64) throw new Error("Missing photo data");
      const uploaded = await uploadProfilePhoto(asset.base64, owner);
      if (owner === useSession.getState().user?.id) onChange(uploaded.avatar);
    } catch {
      setError("عکس ذخیره نشد. دوباره تلاش کنید.");
    } finally {
      setBusy(false);
      onBusy(false);
    }
  };
  return (
    <View style={{ alignItems: "center" }}>
      <Button
        label={t("تغییر عکس")}
        secondary
        plain
        disabled={disabled || busy}
        loading={busy}
        onPress={() => setOpen(true)}
      />
      {error && (
        <Copy accessibilityRole="alert" style={{ color: c.danger }}>
          {t(error)}
        </Copy>
      )}
      <BottomSheet open={open} title="تغییر عکس" onClose={close}>
        <Button
          plain
          label={t("گرفتن عکس")}
          onPress={() => {
            void choose(true);
          }}
        />
        <Button
          plain
          label={t("انتخاب از گالری")}
          onPress={() => {
            void choose(false);
          }}
        />
        <Button
          plain
          label={t("حذف عکس پروفایل")}
          onPress={() => {
            onChange("");
            close();
          }}
        />
      </BottomSheet>
    </View>
  );
}
