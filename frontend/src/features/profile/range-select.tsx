import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ChevronDown, Check, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Copy, Row, Surface } from "../../ui/components";
import { IconButton } from "../../ui/profile-components";
import { componentShadows, usePalette } from "../../ui/theme";
import { useI18n } from "../../i18n";
import type { StatisticsRange } from "./api";

const options = [
  { value: "three_months", label: "۳ ماه گذشته" },
  { value: "year", label: "سال" },
  { value: "all_time", label: "تمام مدت" },
] as const;

export function StatisticsRangeSelect({
  value,
  onChange,
}: {
  value: StatisticsRange;
  onChange: (value: StatisticsRange) => void;
}) {
  const { t, direction } = useI18n();
  const c = usePalette();
  const safe = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const trigger = useRef<View>(null);
  const panel = useRef<View>(null);
  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const opener = trigger.current as unknown as HTMLElement | null;
    const element = () => panel.current as unknown as HTMLElement | null;
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
      if (event.key === "Tab") {
        const buttons =
          element()?.querySelectorAll<HTMLElement>('[role="button"]');
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    const timer = setTimeout(() => {
      element()?.querySelector<HTMLElement>('[aria-pressed="true"]')?.focus();
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", keydown);
      opener?.focus();
    };
  }, [open]);
  return (
    <View style={{ alignItems: "flex-end", marginVertical: -6 }}>
      <Pressable
        ref={trigger}
        accessibilityRole="button"
        accessibilityLabel={
          t("بازه زمانی") +
          ": " +
          t(options.find((o) => o.value === value)!.label)
        }
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        aria-haspopup="dialog"
        onPress={() => setOpen(true)}
        onFocus={() => setFocus("trigger")}
        onBlur={() => setFocus(null)}
        style={{
          minHeight: 48,
          justifyContent: "center",
          paddingHorizontal: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: focus === "trigger" ? c.primary : "transparent",
        }}
      >
        <Row style={{ gap: 6 }}>
          <Copy control style={{ color: c.primary }}>
            {t(options.find((o) => o.value === value)!.label)}
          </Copy>
          <ChevronDown size={16} color={c.primary} />
        </Row>
      </Pressable>
      <Modal
        transparent
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            direction,
            backgroundColor: "#10203588",
            justifyContent: "flex-end",
            paddingLeft: safe.left,
            paddingRight: safe.right,
            paddingTop: safe.top + 16,
          }}
        >
          <Pressable
            accessible={false}
            focusable={false}
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            ref={panel}
            role="dialog"
            aria-label={t("بازه زمانی")}
            aria-modal={true}
            accessibilityViewIsModal
            style={{
              width: "100%",
              maxWidth: 600,
              maxHeight: "100%",
              alignSelf: "center",
            }}
          >
            <Surface
              style={{
                flexShrink: 1,
                gap: 4,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                paddingBottom: Math.max(safe.bottom, 14),
                boxShadow: componentShadows(c).sheet,
              }}
            >
              <Row>
                <View style={{ flex: 1 }}>
                  <Copy variant="title">{t("بازه زمانی")}</Copy>
                </View>
                <IconButton
                  label="بستن پنجره"
                  icon={X}
                  onPress={() => setOpen(false)}
                />
              </Row>
              <ScrollView
                style={{ flexShrink: 1 }}
                keyboardShouldPersistTaps="handled"
              >
                {options.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityLabel={t(option.label)}
                    accessibilityState={{ selected: value === option.value }}
                    aria-pressed={value === option.value}
                    onFocus={() => setFocus(option.value)}
                    onBlur={() => setFocus(null)}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => ({
                      minHeight: 48,
                      paddingHorizontal: 12,
                      justifyContent: "center",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        focus === option.value ? c.primary : "transparent",
                      backgroundColor:
                        pressed || value === option.value ? c.blue : c.surface,
                    })}
                  >
                    <Row style={{ justifyContent: "space-between" }}>
                      <Copy control>{t(option.label)}</Copy>
                      {value === option.value && (
                        <Check size={16} color={c.primary} />
                      )}
                    </Row>
                  </Pressable>
                ))}
              </ScrollView>
            </Surface>
          </View>
        </View>
      </Modal>
    </View>
  );
}
