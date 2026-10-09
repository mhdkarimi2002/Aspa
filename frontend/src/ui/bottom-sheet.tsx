import { useEffect, useRef, type ReactNode } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Copy, Row, Surface } from "./components";
import { IconButton } from "./profile-components";
import { componentShadows, usePalette } from "./theme";
import { useI18n } from "../i18n";

export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t, direction } = useI18n();
  const c = usePalette();
  const safe = useSafeAreaInsets();
  const panel = useRef<View>(null);
  useEffect(() => {
    if (!open || Platform.OS !== "web") return;
    const opener = document.activeElement as HTMLElement | null;
    const controls = () =>
      (
        panel.current as unknown as HTMLElement | null
      )?.querySelectorAll<HTMLElement>('[tabindex="0"], button, input');
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(controls() ?? []).filter(
        (n) => !n.hasAttribute("disabled"),
      );
      if (!nodes.length) return;
      if (event.shiftKey && document.activeElement === nodes[0]) {
        event.preventDefault();
        nodes.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) {
        event.preventDefault();
        nodes[0].focus();
      }
    };
    const timer = setTimeout(() => controls()?.[0]?.focus(), 80);
    document.addEventListener("keydown", key);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", key);
      opener?.focus();
    };
  }, [open, onClose]);
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          direction,
          backgroundColor: "#10203588",
          justifyContent: "flex-end",
          paddingTop: safe.top + 16,
          paddingLeft: safe.left,
          paddingRight: safe.right,
        }}
      >
        <Pressable
          accessible={false}
          focusable={false}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          ref={panel}
          role="dialog"
          aria-label={t(title)}
          aria-modal
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
              gap: 8,
              flexShrink: 1,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingBottom: Math.max(safe.bottom, 14),
              boxShadow: componentShadows(c).sheet,
            }}
          >
            <Row>
              <View style={{ flex: 1 }}>
                <Copy variant="title">{t(title)}</Copy>
              </View>
              <IconButton label="بستن پنجره" icon={X} onPress={onClose} />
            </Row>
            {children}
          </Surface>
        </View>
      </View>
    </Modal>
  );
}
