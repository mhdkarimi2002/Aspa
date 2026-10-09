import { useCallback, useState } from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { Check } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { getProvinces } from "./api";
import { BottomSheet } from "../../ui/bottom-sheet";
import { Copy, ErrorState, LoadingState, Row } from "../../ui/components";
import { usePalette } from "../../ui/theme";
import { useI18n } from "../../i18n";

export function ProvincePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const { t, language } = useI18n();
  const c = usePalette();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const catalogue = useQuery({
    queryKey: ["iran-provinces"],
    queryFn: ({ signal }) => getProvinces(signal),
    staleTime: Infinity,
  });
  const options = [...(catalogue.data ?? [])].sort((a, b) =>
    a[language].localeCompare(b[language], language),
  );
  const selected = catalogue.data?.find((p) => p.id === value);
  return (
    <>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t("استان")}
        aria-haspopup="dialog"
        accessibilityState={{ expanded: open, disabled }}
        onPress={() => setOpen(true)}
        style={{ minHeight: 48, justifyContent: "center" }}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <Copy>{t("استان")}</Copy>
          <Copy
            numberOfLines={2}
            style={{
              color: c.primary,
              maxWidth: "70%",
              textAlign: language === "fa" ? "left" : "right",
            }}
          >
            {selected?.[language] ?? (value || t("انتخاب استان"))}
          </Copy>
        </Row>
      </Pressable>
      <BottomSheet open={open} title="استان" onClose={close}>
        {catalogue.isPending ? (
          <LoadingState />
        ) : catalogue.isError ? (
          <ErrorState
            flat
            retry={() => {
              void catalogue.refetch();
            }}
          />
        ) : (
          <ScrollView
            style={{ maxHeight: height * 0.55, flexShrink: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {[
              { id: "", fa: t("بدون انتخاب"), en: t("بدون انتخاب") },
              ...options,
            ].map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="radio"
                accessibilityLabel={p[language]}
                accessibilityState={{ checked: value === p.id }}
                aria-checked={value === p.id}
                onPress={() => {
                  onChange(p.id);
                  close();
                }}
                style={{
                  minHeight: 48,
                  justifyContent: "center",
                  paddingHorizontal: 10,
                  backgroundColor: value === p.id ? c.blue : "transparent",
                  borderRadius: 8,
                }}
              >
                <Row style={{ justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Copy>{p[language]}</Copy>
                  </View>
                  {value === p.id && <Check size={18} color={c.primary} />}
                </Row>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </BottomSheet>
    </>
  );
}
