import { format } from "dictly/react";
import { useState } from "react";

import { LANGUAGE_NAMES, setSlowNetwork, useLocale, useT } from "./i18n";

const REPOSITORY_URL = "https://github.com/axtew/dictly";

export function Header() {
  const l = useT((d) => d.header);
  const { locale, locales, pendingLocale, setLocale } = useLocale();
  const [slow, setSlow] = useState(false);

  return (
    <header className="header">
      <div className="brand">
        <h1>dictly</h1>
        <a href={REPOSITORY_URL}>GitHub</a>
      </div>
      <p className="tagline">{l.tagline}</p>

      <div className="controls">
        <div className="languages" role="group" aria-label={l.language}>
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              lang={code}
              aria-pressed={code === locale}
              aria-busy={code === pendingLocale}
              onClick={() => void setLocale(code)}
            >
              {LANGUAGE_NAMES[code]}
            </button>
          ))}
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={slow}
            onChange={(event) => {
              setSlow(event.target.checked);
              setSlowNetwork(event.target.checked);
            }}
          />
          {l.slowNetwork}
        </label>
      </div>

      <p className="hint">{l.slowNetworkHint}</p>
      <p className="status" aria-live="polite">
        {pendingLocale !== null && format(l.loading, { language: LANGUAGE_NAMES[pendingLocale] })}
      </p>
    </header>
  );
}
