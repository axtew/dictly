import type { DictionaryIssue } from "dictly";
import { checkDictionaries } from "dictly/check";
import { format } from "dictly/react";
import { useEffect, useState } from "react";

import { DE_DICTIONARY_PATH, fetchJson, LANGUAGE_NAMES, useFormatters, useT } from "../i18n";
import { reference, translation } from "./brokenExample";

interface CheckResults {
  live: DictionaryIssue[];
  broken: DictionaryIssue[];
}

/**
 * The dictionaries are loaded only when this screen is opened. The checker itself
 * is in the main chunk: `validate` imports it statically (see `i18n/index.ts`).
 */
async function runChecks(): Promise<CheckResults> {
  const [en, ru, de] = await Promise.all([
    import("../i18n/dictionaries/en"),
    import("../i18n/dictionaries/ru"),
    fetchJson<unknown>(DE_DICTIONARY_PATH),
  ]);

  return {
    live: checkDictionaries({
      dictionaries: { en: en.default, ru: ru.default, de },
      reference: "en",
    }),
    broken: checkDictionaries({
      dictionaries: { en: reference, ru: translation },
      reference: "en",
    }),
  };
}

function IssuesTable({ issues }: { issues: readonly DictionaryIssue[] }) {
  const l = useT((d) => d.check.columns);

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{l.path}</th>
            <th>{l.kind}</th>
            <th>{l.message}</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={`${issue.locale}:${issue.path}:${issue.kind}:${issue.message}`}>
              <td>
                <code>
                  {issue.locale}.{issue.path}
                </code>
              </td>
              <td>
                <code>{issue.kind}</code>
              </td>
              <td>{issue.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CheckScreen() {
  const l = useT((d) => d.check);
  const { list, plural } = useFormatters();
  const [results, setResults] = useState<CheckResults | null>(null);

  useEffect(() => {
    let active = true;

    runChecks()
      .then((checked) => {
        if (active) setResults(checked);
      })
      .catch((error: unknown) => console.error(error));

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card">
      <h2>{l.title}</h2>
      <p className="intro">{l.intro}</p>

      <h3>{l.liveTitle}</h3>
      {results === null ? (
        <p className="muted">{l.running}</p>
      ) : results.live.length === 0 ? (
        <p className="result ok">
          {format(l.liveOk, { languages: list(Object.values(LANGUAGE_NAMES)) })}
        </p>
      ) : (
        <>
          <p className="result">{plural(l.liveIssues, results.live.length)}</p>
          <IssuesTable issues={results.live} />
        </>
      )}

      <h3>{l.brokenTitle}</h3>
      <p>{l.brokenIntro}</p>
      <div className="columns">
        <figure>
          <figcaption>{l.reference}</figcaption>
          <pre>
            <code>{JSON.stringify(reference, null, 2)}</code>
          </pre>
        </figure>
        <figure>
          <figcaption>{l.translation}</figcaption>
          <pre>
            <code>{JSON.stringify(translation, null, 2)}</code>
          </pre>
        </figure>
      </div>
      {results !== null && <IssuesTable issues={results.broken} />}
    </section>
  );
}
