import { createI18n } from "dictly";
import { createI18nReact, format } from "dictly/react";
const en = {
  greeting: "Hello, {:name}!",
  recipes: { one: "{:count} recipe", other: "{:count} recipes" },
};
const i18n = createI18n({
  locales: { en: () => Promise.resolve(en), ru: () => import("./ru.js") },
  defaultLocale: "en",
});
const { I18nProvider, useT, useFormatters, useLocale } = createI18nReact(i18n);
function Inner() {
  const l = useT();
  const { plural } = useFormatters();
  const { setLocale } = useLocale();
  return (
    <p onClick={() => void setLocale("ru")}>
      {format(l.greeting, { name: "Anna" })} {plural(l.recipes, 5)}
    </p>
  );
}
export function App() {
  return (
    <I18nProvider>
      <Inner />
    </I18nProvider>
  );
}
