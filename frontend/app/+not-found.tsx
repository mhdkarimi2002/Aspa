import { useI18n } from "../src/i18n";
import { router } from "expo-router";
import { MapPin } from "lucide-react-native";
import { Screen, EmptyState, Button } from "../src/ui/components";
export default function NotFound() {
  const { t } = useI18n();
  return (
    <Screen>
      <EmptyState
        icon={MapPin}
        title={t("این صفحه پیدا نشد")}
        description={t("از صفحه خانه ادامه بدهید.")}
      />
      <Button label={t("بازگشت به خانه")} onPress={() => router.replace("/")} />
    </Screen>
  );
}
