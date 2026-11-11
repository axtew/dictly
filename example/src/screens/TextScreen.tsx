import { format } from "dictly/react";
import { useState } from "react";

import { useFormatters, useT } from "../i18n";

const DOCS_URL = "https://github.com/axtew/dictly#readme";
const ISSUES_URL = "https://github.com/axtew/dictly/issues";

/** Counts worth trying: they hit every Russian form, including `other` for fractions. */
const SAMPLE_COUNTS = [0, 1, 2, 5, 11, 21, 1.5];

/** A number from an input, or `null` while the text is not a non-negative number. */
function parseCount(text: string): number | null {
  const value = Number(text);

  return text.trim() !== "" && Number.isFinite(value) && value >= 0 ? value : null;
}

export function TextScreen() {
  const l = useT((d) => d.text);
  const { plural, locale } = useFormatters();

  // `null` until edited: the default name follows the language.
  const [name, setName] = useState<string | null>(null);
  const [messagesText, setMessagesText] = useState("3");
  const [countText, setCountText] = useState("5");

  const shownName = name ?? l.defaultName;
  const messages = parseCount(messagesText);
  const count = parseCount(countText);

  return (
    <>
      <section className="card">
        <h2>{l.title}</h2>
        <p className="intro">{l.intro}</p>

        <div className="fields">
          <label>
            {l.nameLabel}
            <input value={shownName} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            {l.messagesLabel}
            <input
              type="number"
              min={0}
              value={messagesText}
              onChange={(event) => setMessagesText(event.target.value)}
            />
          </label>
        </div>

        <p className="result">
          {messages !== null &&
            format(l.greeting, { name: shownName, messages: plural(l.messages, messages) })}
        </p>
        <pre>
          <code>{`format(l.greeting, {
  name,
  messages: plural(l.messages, ${messages ?? "count"}),
})`}</code>
        </pre>
      </section>

      <section className="card">
        <h2>{l.pluralTitle}</h2>
        <p className="intro">{l.pluralIntro}</p>

        <div className="fields">
          <label>
            {l.countLabel}
            <input
              type="number"
              min={0}
              step="any"
              value={countText}
              onChange={(event) => setCountText(event.target.value)}
            />
          </label>
          <div className="chips">
            {SAMPLE_COUNTS.map((sample) => (
              <button key={sample} type="button" onClick={() => setCountText(String(sample))}>
                {sample}
              </button>
            ))}
          </div>
        </div>

        {count !== null && (
          <p className="result">
            {plural(l.recipes, count)}
            <span className="muted">
              {format(l.category, { category: new Intl.PluralRules(locale).select(count) })}
            </span>
          </p>
        )}
        <pre>
          <code>{`plural(l.recipes, ${count ?? "count"})`}</code>
        </pre>
      </section>

      <section className="card">
        <h2>{l.richTitle}</h2>
        <p className="intro">{l.richIntro}</p>

        <p className="result">
          {format(l.rich, {
            docs: <a href={DOCS_URL}>{l.docs}</a>,
            issue: <a href={ISSUES_URL}>{l.issue}</a>,
          })}
        </p>
        <pre>
          <code>{`format(l.rich, {
  docs: <a href={DOCS_URL}>{l.docs}</a>,
  issue: <a href={ISSUES_URL}>{l.issue}</a>,
})`}</code>
        </pre>
      </section>
    </>
  );
}
