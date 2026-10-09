import { View } from "react-native";
import { router } from "expo-router";
import { Button } from "./components";
import { useI18n } from "../i18n";
export function ProfileTabs({
  selected,
}: {
  selected: "profile" | "settings";
}) {
  const { t } = useI18n();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: "row", gap: 12 }}>
      {(["profile", "settings"] as const).map((tab) => (
        <View key={tab} style={{ flex: 1 }}>
          <Button
            role="tab"
            label={t(tab === "profile" ? "پروفایل" : "تنظیمات")}
            selected={selected === tab}
            secondary={selected !== tab}
            onPress={() =>
              router.replace(tab === "profile" ? "/profile" : "/settings")
            }
          />
        </View>
      ))}
    </View>
  );
}
