import { usePreferences } from "../state/preferences";
import { translate } from "./messages";
export function useI18n() {
  const language = usePreferences((s) => s.language);
  return {
    language,
    direction: language === "fa" ? ("rtl" as const) : ("ltr" as const),
    t: (key: string, values?: Record<string, string>) =>
      translate(language, key, values),
  };
}
