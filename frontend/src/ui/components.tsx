import { useI18n } from "../i18n";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Text,
  TextInput,
  View,
  type TextProps,
  type TextInputProps,
  type ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, type LucideIcon } from "lucide-react-native";
import { componentShadows, usePalette } from "./theme";

export function Copy({
  variant = "body",
  control = false,
  style,
  ...props
}: TextProps & {
  variant?: "body" | "small" | "title" | "display";
  control?: boolean;
}) {
  const c = usePalette();
  const { direction } = useI18n();
  const size = { body: 14, small: 12, title: 20, display: 24 }[variant];
  return (
    <Text
      accessibilityRole={
        variant === "title" || variant === "display" ? "header" : undefined
      }
      {...props}
      style={[
        {
          color: c.text,
          fontFamily:
            variant === "title" || variant === "display"
              ? "VazirmatnBold"
              : "Vazirmatn",
          fontSize: size,
          lineHeight: size * 1.45,
          // Optical alignment for Vazirmatn's large descender space.
          ...(control
            ? {
                includeFontPadding: false,
                textAlignVertical: "center" as const,
                transform: [
                  {
                    translateY:
                      typeof props.children === "string" &&
                      /[\u0600-\u06ff]/.test(props.children)
                        ? 1
                        : 3,
                  },
                ],
              }
            : {}),
          textAlign: direction === "rtl" ? "right" : "left",
          writingDirection: direction,
        },
        style,
      ]}
    />
  );
}
export function Surface({
  inset = false,
  style,
  ...props
}: ViewProps & { inset?: boolean }) {
  const c = usePalette();
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: c.surface,
          padding: 14,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: c.border,
          boxShadow: inset
            ? componentShadows(c).inset
            : componentShadows(c).surface,
        },
        style,
      ]}
    />
  );
}
export function Row({ style, ...props }: ViewProps) {
  return (
    <View
      {...props}
      style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, style]}
    />
  );
}
export function Screen({
  children,
  header,
  headerDivider = true,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  headerDivider?: boolean;
}) {
  const c = usePalette();
  const safe = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {header && (
        <View
          style={{
            paddingTop: safe.top + 8,
            paddingHorizontal: 16,
            paddingBottom: 8,
            backgroundColor: c.background,
            borderBottomWidth: headerDivider ? 1 : 0,
            borderColor: c.border,
          }}
        >
          {header}
        </View>
      )}
      <ScrollView
        style={{ flex: 1, minHeight: 0, backgroundColor: c.background }}
        contentContainerStyle={{
          paddingTop: header ? 12 : safe.top + 12,
          paddingBottom: 20,
          paddingHorizontal: 16,
          width: "100%",
          maxWidth: 600,
          alignSelf: "center",
          gap: 14,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function IconTile({
  icon: Icon,
  color,
  size = 20,
}: {
  icon: LucideIcon;
  color?: string;
  size?: number;
}) {
  const c = usePalette();
  return (
    <View
      style={{
        backgroundColor: color ?? c.blue,
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={size} color={c.text} strokeWidth={1.7} />
    </View>
  );
}
export function Button({
  label,
  onPress,
  secondary = false,
  plain = false,
  disabled = false,
  loading = false,
  icon: Icon,
  role = "button",
  selected,
}: {
  selected?: boolean;
  role?: "button" | "tab";
  label: string;
  onPress: () => void;
  secondary?: boolean;
  plain?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
}) {
  const c = usePalette();
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={t(label)}
      aria-pressed={role === "button" ? selected : undefined}
      aria-selected={role === "tab" ? selected : undefined}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
        selected,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: plain ? 0 : 12,
        borderWidth: plain ? 0 : 2,
        borderBottomWidth: plain ? 0 : 2,
        borderColor: focused ? c.text : "transparent",
        backgroundColor: plain
          ? "transparent"
          : secondary
            ? c.surface
            : c.primary,
        opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
        alignItems: "center",
        boxShadow: secondary && !plain ? componentShadows(c).button : undefined,
      })}
    >
      {plain && focused && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            backgroundColor: c.text,
          }}
        />
      )}
      {loading ? (
        <ActivityIndicator
          color={secondary || plain ? c.primary : c.background}
        />
      ) : Icon ? (
        <Icon size={18} color={secondary || plain ? c.primary : c.background} />
      ) : null}
      <Copy
        control
        style={{
          color: secondary || plain ? c.primary : c.background,
          fontFamily: "VazirmatnBold",
          textAlign: "center",
        }}
      >
        {label}
      </Copy>
    </Pressable>
  );
}
export function Field({
  label,
  error,
  inputDirection,
  plain = false,
  inline = false,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  inputDirection?: "ltr" | "rtl";
  plain?: boolean;
  inline?: boolean;
}) {
  const c = usePalette();
  const { t, direction } = useI18n();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: inline ? "row" : "column",
          direction,
          alignItems: inline ? "center" : undefined,
          gap: inline ? 12 : 4,
        }}
      >
        <Copy style={inline ? { width: 72 } : undefined}>{label}</Copy>
        <TextInput
          {...props}
          accessibilityLabel={t(label)}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          placeholder={props.placeholder ? t(props.placeholder) : undefined}
          placeholderTextColor={c.muted}
          style={{
            ...(inline ? { flex: 1, minWidth: 0 } : {}),
            minHeight: 48,
            borderWidth: plain ? 0 : 2,
            borderBottomWidth: plain ? (focused || error ? 2 : 0) : 2,
            borderColor: error ? c.danger : focused ? c.primary : c.border,
            borderRadius: plain ? 0 : 12,
            padding: 10,
            color: c.text,
            fontFamily: "Vazirmatn",
            fontSize: 16,
            textAlign:
              (inputDirection ?? direction) === "rtl" ? "right" : "left",
            writingDirection: inputDirection ?? direction,
            backgroundColor: plain ? "transparent" : c.surface,
            boxShadow: plain ? undefined : componentShadows(c).field,
          }}
        />
      </View>
      {error && (
        <Copy
          accessibilityRole="alert"
          style={{ color: c.danger }}
          variant="small"
        >
          {t(error)}
        </Copy>
      )}
    </View>
  );
}
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  const c = usePalette();
  return (
    <Surface style={{ alignItems: "center", gap: 12, paddingVertical: 24 }}>
      <IconTile icon={Icon} color={c.purple} size={24} />
      <Copy variant="title" style={{ textAlign: "center" }}>
        {title}
      </Copy>
      <Copy style={{ textAlign: "center", color: c.muted, maxWidth: 440 }}>
        {description}
      </Copy>
    </Surface>
  );
}
export function LoadingState() {
  const c = usePalette();
  const { t } = useI18n();
  return (
    <Row
      accessibilityLabel={t("در حال بارگذاری")}
      style={{ justifyContent: "center", padding: 16 }}
    >
      <ActivityIndicator color={c.primary} />
      <Copy>{t("در حال بارگذاری…")}</Copy>
    </Row>
  );
}
export function ErrorState({
  retry,
  flat = false,
}: {
  retry: () => void;
  flat?: boolean;
}) {
  const c = usePalette();
  const { t } = useI18n();
  const Container = flat ? View : Surface;
  return (
    <Container style={{ gap: 12 }}>
      <Copy style={{ color: c.danger }} accessibilityRole="alert">
        {t("اتصال برقرار نشد. اینترنت و آدرس سرویس را بررسی کنید.")}
      </Copy>
      <Button label={t("تلاش دوباره")} secondary plain={flat} onPress={retry} />
    </Container>
  );
}
export function Dialog({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const c = usePalette();
  const { t, direction } = useI18n();
  const close = useRef<View>(null);
  useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    const previous = document.activeElement as HTMLElement | null;
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        e.preventDefault();
        (close.current as unknown as HTMLElement)?.focus();
      }
    };
    document.addEventListener("keydown", listener);
    const timer = setTimeout(
      () => (close.current as unknown as HTMLElement)?.focus(),
      50,
    );
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", listener);
      previous?.focus();
    };
  }, [visible, onClose]);
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View
        accessibilityViewIsModal
        role="dialog"
        aria-label={t("یک قدم کوچک، هر روز")}
        style={{
          direction,
          flex: 1,
          backgroundColor: "#10203588",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Surface
          style={{ width: "100%", maxWidth: 440, alignSelf: "center", gap: 16 }}
        >
          <Copy variant="title">{t("یک قدم کوچک، هر روز")}</Copy>
          <Copy>{t("این پنجره برای بررسی ظاهر و رفتار اجزای رابط است.")}</Copy>
          <Pressable
            ref={close}
            accessibilityRole="button"
            accessibilityLabel={t("بستن پنجره")}
            onPress={onClose}
            style={{
              minHeight: 48,
              borderRadius: 12,
              backgroundColor: c.blue,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
            }}
          >
            <X color={c.text} size={20} />
            <Copy>{t("بستن پنجره")}</Copy>
          </Pressable>
        </Surface>
      </View>
    </Modal>
  );
}
