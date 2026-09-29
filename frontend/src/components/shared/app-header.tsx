import { getLocale } from "@/shared/i18n/get-locale";
import Header from "./header";

const AppHeader = async () => {
  const locale = await getLocale();
  return <Header locale={locale} />;
};

export default AppHeader;
