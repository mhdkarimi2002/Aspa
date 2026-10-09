import { useCallback, useState } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserRound,
  LockKeyhole,
  Crown,
  Languages,
  Moon,
  CircleHelp,
  Mail,
  Star,
  Info,
  LogOut,
} from "lucide-react-native";
import { Screen, Copy, Surface, Button, Row } from "../src/ui/components";
import { BottomSheet } from "../src/ui/bottom-sheet";
import { ProfileHeader, SettingsRow } from "../src/ui/profile-components";
import { useI18n } from "../src/i18n";
import { usePreferences } from "../src/state/preferences";
import { session, useSession } from "../src/auth/session";

export default function Settings() {
  const { t, language } = useI18n();
  const { theme, setTheme, setLanguage } = usePreferences();
  const { height } = useWindowDimensions();
  const cache = useQueryClient();
  const user = useSession((s) => s.user);
  const [section, setSection] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"help" | "about">("help");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const logout = async () => {
    setLogoutPending(true);
    try {
      await session.logout();
    } catch {
      // Logout clears the device session even if remote revocation is unavailable.
      if (useSession.getState().status === "authenticated") return;
    } finally {
      cache.clear();
      setLogoutPending(false);
      if (useSession.getState().status === "guest") router.replace("/profile");
    }
  };
  return (
    <Screen header={<ProfileHeader title="تنظیمات" />}>
      <Copy variant="small">{t("حساب")}</Copy>
      <Surface style={{ paddingVertical: 0 }}>
        <SettingsRow
          label="پروفایل"
          icon={UserRound}
          onPress={() => router.push(user ? "/account" : "/login")}
        />
        <SettingsRow
          label="حساب"
          icon={LockKeyhole}
          onPress={() => router.push(user ? "/account-settings" : "/login")}
        />
        <SettingsRow
          label="اشتراک"
          icon={Crown}
          value={t(user?.account_level === "pro" ? "حرفه‌ای" : "رایگان")}
          onPress={() =>
            setSection(section === "subscription" ? null : "subscription")
          }
        />
      </Surface>
      {section === "subscription" && (
        <Surface style={{ gap: 8 }}>
          <Copy>
            {t(
              user?.account_level === "pro"
                ? "سطح حساب: حرفه‌ای"
                : "سطح حساب: رایگان",
            )}
          </Copy>
          <Copy>{t("مدیریت پرداخت و اشتراک فعلاً در دسترس نیست.")}</Copy>
        </Surface>
      )}
      <Copy variant="small">{t("ترجیحات")}</Copy>
      <Surface style={{ paddingVertical: 0 }}>
        <SettingsRow
          label="زبان برنامه"
          icon={Languages}
          value={language === "fa" ? "فارسی" : "English"}
          onPress={() => setSection(section === "language" ? null : "language")}
        />
        {section === "language" && (
          <Row style={{ paddingVertical: 10 }}>
            {(["fa", "en"] as const).map((value) => (
              <View key={value} style={{ flex: 1 }}>
                <Button
                  label={value === "fa" ? "فارسی" : "English"}
                  selected={language === value}
                  secondary={language !== value}
                  onPress={() => setLanguage(value)}
                />
              </View>
            ))}
          </Row>
        )}
        <SettingsRow
          label="ظاهر برنامه"
          icon={Moon}
          value={t(theme === "dark" ? "تیره" : "روشن")}
          onPress={() => setSection(section === "theme" ? null : "theme")}
        />
        {section === "theme" && (
          <Row style={{ paddingVertical: 10 }}>
            {(["light", "dark"] as const).map((value) => (
              <View key={value} style={{ flex: 1 }}>
                <Button
                  label={t(value === "light" ? "روشن" : "تیره")}
                  selected={theme === value}
                  secondary={theme !== value}
                  onPress={() => setTheme(value)}
                />
              </View>
            ))}
          </Row>
        )}
      </Surface>
      <Copy variant="small">{t("پشتیبانی")}</Copy>
      <Surface style={{ paddingVertical: 0 }}>
        <SettingsRow
          label="راهنما"
          icon={CircleHelp}
          onPress={() => {
            setSheet("help");
            setSheetOpen(true);
          }}
        />
        <SettingsRow label="تماس با ما" icon={Mail} disabled />
        <SettingsRow label="امتیاز به آسپا در گوگل پلی" icon={Star} disabled />
        <SettingsRow
          label="درباره آسپا"
          icon={Info}
          onPress={() => {
            setSheet("about");
            setSheetOpen(true);
          }}
        />
      </Surface>
      <Button
        label={t("خروج از حساب")}
        icon={LogOut}
        secondary
        plain
        disabled={!user}
        loading={logoutPending}
        onPress={() => {
          void logout();
        }}
      />
      <BottomSheet
        open={sheetOpen}
        title={sheet === "about" ? "درباره آسپا" : "راهنما"}
        onClose={closeSheet}
      >
        <ScrollView
          style={{ maxHeight: height * 0.55, flexShrink: 1 }}
          contentContainerStyle={{ gap: 12 }}
        >
          {sheet === "about" ? (
            <>
              <Copy variant="title">{t("آسپا")}</Copy>
              <Copy>
                {t(
                  "آسپا همراه شما برای ثبت تمرین، ساخت روتین و دنبال‌کردن پیشرفت است.",
                )}
              </Copy>
              <Copy variant="small">
                {t("نسخه {version}", {
                  version: Constants.expoConfig?.version ?? "0.1.0",
                })}
              </Copy>
            </>
          ) : (
            <>
              <Copy>
                {t(
                  "برای ورود، شماره موبایل و کد پنج‌رقمی را وارد کنید. اگر حساب نداشته باشید، خودکار ساخته می‌شود.",
                )}
              </Copy>
              <Copy>
                {t(
                  "برای ویرایش نام، عکس، استان و تاریخ تولد، از پروفایل به ویرایش پروفایل بروید.",
                )}
              </Copy>
              <Copy>
                {t(
                  "زبان و ظاهر برنامه را در تنظیمات تغییر دهید. تغییر زبان شما را از حساب خارج نمی‌کند.",
                )}
              </Copy>
            </>
          )}
        </ScrollView>
      </BottomSheet>
    </Screen>
  );
}
