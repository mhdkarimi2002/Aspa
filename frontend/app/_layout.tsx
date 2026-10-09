import { WorkoutProvider } from "../src/features/workouts/provider";
import { BottomNavigation } from "../src/ui/bottom-navigation";
import { useI18n } from "../src/i18n";
import { useEffect } from "react";
import { AppState, Platform, View } from "react-native";
import { LocaleProvider, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { Vazirmatn_400Regular } from "@expo-google-fonts/vazirmatn/400Regular";
import { Vazirmatn_700Bold } from "@expo-google-fonts/vazirmatn/700Bold";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { usePreferences } from "../src/state/preferences";
import {
  Copy,
  LoadingState,
  Screen,
  Surface,
  Button,
} from "../src/ui/components";
import { usePalette } from "../src/ui/theme";
import { initializeSession, useSession, session } from "../src/auth/session";
const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});
export default function Layout() {
  const [fonts, error] = useFonts({
    Vazirmatn: Vazirmatn_400Regular,
    VazirmatnBold: Vazirmatn_700Bold,
  });
  const c = usePalette();
  const { t, direction } = useI18n();
  const offline = useSession((s) => s.offline);
  const sessionStatus = useSession((s) => s.status);
  const theme = usePreferences((s) => s.theme);
  useEffect(() => {
    void usePreferences.persist.rehydrate();
    void initializeSession();
    const unsubscribe = useSession.subscribe((next, previous) => {
      if (next.user?.id !== previous.user?.id) {
        void client.cancelQueries();
        client.clear();
      }
    });
    const sub = AppState.addEventListener("change", (state) => {
      if (Platform.OS !== "web") focusManager.setFocused(state === "active");
    });
    return () => {
      sub.remove();
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (Platform.OS === "web") {
      document.documentElement.lang = direction === "rtl" ? "fa" : "en";
      document.documentElement.dir = direction;
    }
  }, [direction]);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <View
          {...(Platform.OS === "web" ? { dir: direction } : {})}
          style={{ flex: 1, backgroundColor: c.background, direction }}
        >
          <StatusBar style={theme === "dark" ? "light" : "dark"} />
          {error ? (
            <Copy>
              {t("بارگذاری قلم ممکن نشد. برنامه را دوباره باز کنید.")}
            </Copy>
          ) : !fonts || sessionStatus === "loading" ? (
            <LoadingState />
          ) : sessionStatus === "unavailable" ? (
            <Screen>
              <Surface style={{ gap: 16 }}>
                <Copy>{t("بازیابی نشست ممکن نشد. اتصال را بررسی کنید.")}</Copy>
                <Button
                  label={t("تلاش دوباره")}
                  onPress={() => {
                    void initializeSession();
                  }}
                />
                <Button
                  label={t("خروج از این دستگاه")}
                  secondary
                  onPress={() => {
                    void session.clear();
                  }}
                />
              </Surface>
            </Screen>
          ) : (
            <LocaleProvider direction={direction}>
              <WorkoutProvider>
                <View style={{ flex: 1, minHeight: 0 }}>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: c.background },
                    }}
                  />
                </View>
                {offline && (
                  <Copy variant="small" style={{ textAlign: "center" }}>
                    {t("حالت آفلاین؛ تغییرات تمرین روی دستگاه ذخیره می‌شوند.")}
                  </Copy>
                )}
                <BottomNavigation />
              </WorkoutProvider>
            </LocaleProvider>
          )}
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
