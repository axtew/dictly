import { format } from "dictly/react";
import { useEffect } from "react";

import { Header } from "./Header";
import { DE_DICTIONARY_PATH, useT } from "./i18n";
import { ROUTES, useRoute } from "./route";
import { CheckScreen } from "./screens/CheckScreen";
import { FormattersScreen } from "./screens/FormattersScreen";
import { TextScreen } from "./screens/TextScreen";

const SCREENS = {
  text: TextScreen,
  formatters: FormattersScreen,
  check: CheckScreen,
};

export function App() {
  const l = useT();
  const route = useRoute();
  const Screen = SCREENS[route];

  useEffect(() => {
    document.title = l.meta.title;
  }, [l.meta.title]);

  return (
    <div className="page">
      <Header />
      <nav className="tabs">
        {ROUTES.map((name) => (
          <a key={name} href={`#/${name}`} aria-current={name === route ? "page" : undefined}>
            {l.nav[name]}
          </a>
        ))}
      </nav>
      <main>
        <Screen />
      </main>
      <footer className="footer">
        {format(l.footer.sources, { path: <code>{DE_DICTIONARY_PATH}</code> })}
      </footer>
    </div>
  );
}
