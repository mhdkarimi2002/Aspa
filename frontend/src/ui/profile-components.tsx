import { apiUrl } from "../api/runtime";
import { useState } from "react";
import { Image, Pressable, View } from "react-native";
import { router } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import { Copy, Row } from "./components";
import { usePalette } from "./theme";
import { useI18n } from "../i18n";
export function Avatar({
  uri,
  size = 64,
}: {
  uri?: string | null;
  size?: number;
}) {
  const c = usePalette();
  const { t } = useI18n();
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.purple,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {uri && failed !== uri ? (
        <Image
          accessibilityLabel={t("عکس پروفایل")}
          source={{
            uri: uri.startsWith("/api/users/avatars/") ? apiUrl + uri : uri,
          }}
          onError={() => setFailed(uri)}
          style={{ width: size, height: size }}
        />
      ) : (
        <UserRound size={size / 2} color={c.text} />
      )}
    </View>
  );
}
export function IconButton({
  label,
  icon: Icon,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  disabled?: boolean;
}) {
  const c = usePalette();
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(label)}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 48,
        minHeight: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.surface,
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      <Icon size={20} color={c.primary} />
    </Pressable>
  );
}
export function ProfileHeader({
  title,
  action,
  back = "/profile",
}: {
  title: string;
  action?: React.ReactNode;
  back?: "/profile" | "/settings";
}) {
  const { t, language } = useI18n();
  return (
    <Row>
      <IconButton
        label="بازگشت"
        icon={language === "fa" ? ChevronRight : ChevronLeft}
        onPress={() => router.replace(back)}
      />
      <View style={{ flex: 1 }}>
        <Copy variant="title" style={{ textAlign: "center" }}>
          {t(title)}
        </Copy>
      </View>
      {action ?? <View style={{ width: 48 }} />}
    </Row>
  );
}
export function SettingsRow({
  label,
  icon: Icon,
  value,
  onPress,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const c = usePalette();
  const { t, language } = useI18n();
  const Chevron = language === "fa" ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(label)}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 10,
        minHeight: 48,
        borderBottomWidth: 1,
        borderColor: c.border,
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Row>
        <Icon size={20} color={c.text} />
        <View style={{ flex: 1 }}>
          <Copy control>{t(label)}</Copy>
          {disabled && <Copy variant="small">{t("فعلاً در دسترس نیست")}</Copy>}
        </View>
        {value && (
          <Copy variant="small" style={{ color: c.muted, maxWidth: 110 }}>
            {value}
          </Copy>
        )}
        <Chevron size={20} color={c.muted} />
      </Row>
    </Pressable>
  );
}
