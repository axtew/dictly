import type { FormatArgs, Placeholders } from "../types";

/** A value that can be put into a placeholder. */
export type FormatValue = string | number;

/** `{:name}`: the name runs to the first closing brace, as in the `Placeholders` type. */
const PLACEHOLDER = /\{:([^}]*)\}/g;

/** Placeholder names written in a string, each once. */
export function parsePlaceholders(text: string): Set<string> {
  return new Set(Array.from(text.matchAll(PLACEHOLDER), (match) => match[1] ?? ""));
}

/**
 * Puts parameters into the `{:placeholders}` of a translated string.
 *
 * Every occurrence is replaced, values are inserted as they are (`$&` in a value
 * is not a replacement pattern). A placeholder without a value stays in the
 * text: a visible `{:name}` is easier to notice than a silently empty spot.
 */
export function format<S extends string>(
  template: S,
  ...args: FormatArgs<Placeholders<S>, FormatValue>
): string {
  return replacePlaceholders(template, args[0]);
}

export function replacePlaceholders(
  template: string,
  params: Readonly<Record<string, FormatValue>> | undefined,
): string {
  if (params === undefined) return template;

  return template.replace(PLACEHOLDER, (placeholder, name: string) =>
    Object.hasOwn(params, name) ? String(params[name]) : placeholder,
  );
}
