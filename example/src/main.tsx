import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import { I18nProvider } from "./i18n";

const root = document.getElementById("root");

if (root === null) throw new Error("#root is missing in index.html");

createRoot(root).render(
  <StrictMode>
    <I18nProvider
      // Nothing to show before the first dictionary: it is one small chunk away.
      fallback={null}
      // No dictionary means no translated text, so this one screen is in English.
      errorFallback={(retry) => (
        <main className="page error">
          <p>The dictionary could not be loaded.</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </main>
      )}
    >
      <App />
    </I18nProvider>
  </StrictMode>,
);
