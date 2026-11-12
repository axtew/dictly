import { IntlProvider, useIntl } from "react-intl";
const en = {
  greeting: "Hello, {name}!",
  recipes: "{count, plural, one {# recipe} other {# recipes}}",
};
function Inner() {
  const intl = useIntl();
  return (
    <p>
      {intl.formatMessage({ id: "greeting" }, { name: "Anna" })}{" "}
      {intl.formatMessage({ id: "recipes" }, { count: 5 })}
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
