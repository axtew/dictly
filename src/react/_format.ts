import { createElement, Fragment, type ReactNode } from "react";

import { format as formatString, type FormatValue, splitTemplate } from "../format";
import type { FormatArgs, Placeholders } from "../types";

/**
 * `format` for components: the same as the one from `dictly`, and a placeholder
 * may also take a React element.
 *
 * ```tsx
 * format(l.terms, { link: <a href="/terms">{l.termsLink}</a> })
 * ```
 *
 * With strings and numbers only it returns a string; once an element is among
 * the values it returns a fragment, and the type says so.
 */
export function format<S extends string>(
  template: S,
  ...args: FormatArgs<Placeholders<S>, FormatValue>
): string;
export function format<S extends string>(
  template: S,
  ...args: FormatArgs<Placeholders<S>, ReactNode>
): ReactNode;
export function format(template: string, params?: Readonly<Record<string, ReactNode>>): ReactNode {
  const values = params === undefined ? [] : Object.values(params);
  const hasNodes = values.some((value) => typeof value !== "string" && typeof value !== "number");

  if (!hasNodes) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return formatString(template, params as Record<string, FormatValue> | undefined);
  }

  // Children passed one by one need no keys, unlike an array: an element used
  // twice in the template stays a valid child.
  const children = splitTemplate(template).map((part) => {
    if (typeof part === "string") return part;

    return params !== undefined && Object.hasOwn(params, part.name)
      ? params[part.name]
      : part.placeholder;
  });

  return createElement(Fragment, null, ...children);
}
