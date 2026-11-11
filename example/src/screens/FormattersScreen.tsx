import { useState } from "react";

import { useFormatters, useT } from "../i18n";

export function FormattersScreen() {
  const l = useT((d) => d.formatters);
  const { number, date, relativeTime, list } = useFormatters();
  const [now] = useState(() => new Date());
  const { flour, sugar, eggs } = l.ingredients;

  const rows: readonly (readonly [what: string, call: string, result: string])[] = [
    [l.number, "number(1234567.891)", number(1234567.891)],
    [
      l.currency,
      'number(1499.5, { style: "currency", currency: "EUR" })',
      number(1499.5, { style: "currency", currency: "EUR" }),
    ],
    [
      l.percent,
      'number(0.256, { style: "percent", maximumFractionDigits: 1 })',
      number(0.256, { style: "percent", maximumFractionDigits: 1 }),
    ],
    [l.date, 'date(now, { dateStyle: "full" })', date(now, { dateStyle: "full" })],
    [l.time, 'date(now, { timeStyle: "short" })', date(now, { timeStyle: "short" })],
    [
      l.relativePast,
      'relativeTime(-1, "day", { numeric: "auto" })',
      relativeTime(-1, "day", { numeric: "auto" }),
    ],
    [l.relativeFuture, 'relativeTime(3, "hour")', relativeTime(3, "hour")],
    [l.list, "list([flour, sugar, eggs])", list([flour, sugar, eggs])],
  ];

  return (
    <section className="card">
      <h2>{l.title}</h2>
      <p className="intro">{l.intro}</p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{l.columns.what}</th>
              <th>{l.columns.call}</th>
              <th>{l.columns.result}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([what, call, result]) => (
              <tr key={call}>
                <td>{what}</td>
                <td>
                  <code>{call}</code>
                </td>
                <td className="value">{result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
