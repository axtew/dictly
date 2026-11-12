import { useContext } from "react";
import { initI18nReact } from "typesafe-i18n/react";
const en = { greeting: "Hello, {name}!", recipes: "{count} recipe{{s}}" };
const { component: TypesafeI18n, context: I18nContext } = initI18nReact({ en }, { en: {} });
function Inner() {
  const { LL } = useContext(I18nContext);
  return (
    <p>
      {LL.greeting({ name: "Anna" })} {LL.recipes({ count: 5 })}
    </p>
  );
}
export function App() {
  return (
    <TypesafeI18n locale="en">
      <Inner />
    </TypesafeI18n>
  );
}
