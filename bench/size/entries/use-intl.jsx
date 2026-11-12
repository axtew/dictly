import { IntlProvider, useTranslations } from "use-intl";
const en = {
  greeting: "Hello, {name}!",
  recipes: "{count, plural, one {# recipe} other {# recipes}}",
};
function Inner() {
  const t = useTranslations();
  return (
    <p>
      {t("greeting", { name: "Anna" })} {t("recipes", { count: 5 })}
    </p>
  );
}
export function App() {
  return (
    <IntlProvider locale="en" messages={en}>
      <Inner />
    </IntlProvider>
  );
}
