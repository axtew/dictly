import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
const en = {
  greeting: "Hello, {{name}}!",
  recipes_one: "{{count}} recipe",
  recipes_other: "{{count}} recipes",
};
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});
function Inner() {
  const { t, i18n: inst } = useTranslation();
  return (
    <p onClick={() => void inst.changeLanguage("ru")}>
      {t("greeting", { name: "Anna" })} {t("recipes", { count: 5 })}
    </p>
  );
}
export function App() {
  return <Inner />;
}
