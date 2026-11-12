import { i18n } from "@lingui/core";
import { I18nProvider, useLingui } from "@lingui/react";
// Compiled catalog, as the Lingui CLI produces it for production.
const en = {
  greeting: ["Hello, ", ["name"], "!"],
  recipes: [["count", "plural", { one: ["#", " recipe"], other: ["#", " recipes"] }]],
};
i18n.load("en", en);
i18n.activate("en");
function Inner() {
  const { i18n: inst } = useLingui();
  return (
    <p>
      {inst._("greeting", { name: "Anna" })} {inst._("recipes", { count: 5 })}
    </p>
  );
}
export function App() {
  return (
    <I18nProvider i18n={i18n}>
      <Inner />
    </I18nProvider>
  );
}
