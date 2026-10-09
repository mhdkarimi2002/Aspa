import { useState } from "react";
import { View, Pressable } from "react-native";
import { Copy, Row } from "../ui/components";
import { usePalette } from "../ui/theme";
import { useI18n } from "../i18n";
import { usePreferences } from "../state/preferences";
import type { User } from "./schemas";
export function LanguageSelector() {
  const { language } = useI18n();
  const setLanguage = usePreferences((s) => s.setLanguage);
  const c = usePalette();
  return (
    <Row>
      {(["fa", "en"] as const).map((code) => (
        <Pressable
          key={code}
          accessibilityRole="button"
          accessibilityState={{ selected: language === code }}
          aria-pressed={language === code}
          onPress={() => setLanguage(code)}
          style={({ pressed }) => ({
            minHeight: 48,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: c.border,
            backgroundColor: language === code ? c.blue : c.surface,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Copy>{code === "fa" ? "فارسی" : "English"}</Copy>
        </Pressable>
      ))}
    </Row>
  );
}
const genders = {
  male: "مرد",
  female: "زن",
  prefer_not_to_say: "ترجیح می‌دهم نگویم",
};
export function GenderField({
  value,
  onChange,
  plain = false,
}: {
  value: NonNullable<User["gender"]>;
  onChange: (value: NonNullable<User["gender"]>) => void;
  plain?: boolean;
}) {
  const { t } = useI18n();
  const c = usePalette();
  const [focused, setFocused] = useState<string | null>(null);
  return (
    <View style={{ gap: 8 }}>
      <Copy>{t("جنسیت")}</Copy>
      <Row style={{ flexWrap: "wrap" }}>
        {(Object.keys(genders) as (keyof typeof genders)[]).map((gender) => (
          <Pressable
            key={gender}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === gender }}
            aria-checked={value === gender}
            onPress={() => onChange(gender)}
            onFocus={() => setFocused(gender)}
            onBlur={() => setFocused(null)}
            style={({ pressed }) => ({
              minHeight: 48,
              padding: 12,
              borderRadius: 12,
              borderWidth: plain ? 0 : 2,
              borderBottomWidth: plain ? (focused === gender ? 2 : 0) : 2,
              borderColor:
                focused === gender || value === gender ? c.primary : c.border,
              backgroundColor: value === gender ? c.blue : c.surface,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Copy>{t(genders[gender])}</Copy>
          </Pressable>
        ))}
      </Row>
    </View>
  );
}
