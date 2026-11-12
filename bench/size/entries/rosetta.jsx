import rosetta from "rosetta";
// No React bindings and no plural rules: the smallest possible baseline.
const i18n = rosetta({ en: { greeting: "Hello, {{name}}!" } });
i18n.locale("en");
export function App() {
  return <p>{i18n.t("greeting", { name: "Anna" })}</p>;
}
