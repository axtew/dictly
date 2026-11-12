import { count, createI18n, params } from "@nanostores/i18n";
import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
const locale = atom("en");
const i18n = createI18n(locale, { get: () => import("./ru.js").then((m) => m.default) });
const messages = i18n("main", {
  greeting: params("Hello, {name}!"),
  recipes: count({ one: "{count} recipe", many: "{count} recipes" }),
});
function Inner() {
  const t = useStore(messages);
  return (
    <p onClick={() => locale.set("ru")}>
      {t.greeting({ name: "Anna" })} {t.recipes(5)}
    </p>
  );
}
export function App() {
  return <Inner />;
}
