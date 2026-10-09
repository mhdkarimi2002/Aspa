import { useWorkouts } from "../features/workouts/provider";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, usePathname } from "expo-router";
import { Home, Dumbbell, UserRound } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Copy, Button } from "./components";
import { usePalette } from "./theme";
import { useI18n } from "../i18n";
const items = [
  { href: "/" as const, label: "خانه", Icon: Home },
  { href: "/plans" as const, label: "تمرین", Icon: Dumbbell },
  { href: "/profile" as const, label: "پروفایل", Icon: UserRound },
];
export function BottomNavigation() {
  const [focus, setFocus] = useState<string | null>(null);
  const c = usePalette();
  const { t } = useI18n();
  const safe = useSafeAreaInsets();
  const path = usePathname();
  const { entries } = useWorkouts();
  const active = entries.find((e) => e.document.status === "in_progress");
  return (
    <>
      {active && !["/workout", "/finish-workout"].includes(path) && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: c.background,
          }}
        >
          <Button
            label={t("ادامه تمرین") + " · " + t(active.document.plan_name)}
            onPress={() =>
              router.push({
                pathname: "/workout",
                params: { client: active.document.client_id },
              })
            }
          />
        </View>
      )}
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: "row",
          backgroundColor: c.background,
          borderTopWidth: 1,
          borderColor: c.border,
          paddingHorizontal: 12,
          paddingTop: 4,
          paddingBottom: Math.max(safe.bottom, 10),
          gap: 8,
          flexShrink: 0,
        }}
      >
        {items.map(({ href, label, Icon }) => {
          const selected =
            href === "/profile"
              ? [
                  "/profile",
                  "/settings",
                  "/account",
                  "/account-settings",
                  "/statistics",
                  "/calendar",
                  "/delete-account",
                  "/login",
                  "/exercises",
                  "/exercise",
                  "/history",
                  "/workout-summary",
                ].includes(path)
              : href === "/plans"
                ? [
                    "/plans",
                    "/plan",
                    "/plan-exercise",
                    "/new-plan",
                    "/plan-share",
                    "/shared-plan",
                    "/workout",
                    "/finish-workout",
                    "/pick-exercises",
                  ].includes(path)
                : path === href;
          return (
            <Pressable
              key={href}
              accessibilityRole="tab"
              accessibilityLabel={t(label)}
              aria-selected={selected}
              accessibilityState={{ selected }}
              onPress={() => router.replace(href)}
              onFocus={() => setFocus(href)}
              onBlur={() => setFocus(null)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 52,
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: focus === href ? c.text : "transparent",
                backgroundColor: selected ? c.blue : c.surface,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Icon size={20} color={selected ? c.primary : c.muted} />
              <Copy
                variant="small"
                style={{
                  textAlign: "center",
                  color: selected ? c.primary : c.muted,
                }}
              >
                {t(label)}
              </Copy>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}
