import type { FormatArgs, PluralCategory, PluralForms, PluralPlaceholders } from "../types";
import { type FormatValue, replacePlaceholders } from "./_format";

/** Formats a plural phrase in one language. */
export type PluralFormatter = <F extends PluralForms>(
  forms: F,
  count: number,
  ...args: FormatArgs<Exclude<PluralPlaceholders<F>, "count">, FormatValue>
) => string;

const pluralRules = new Map<string, Intl.PluralRules>();
const numberFormats = new Map<string, Intl.NumberFormat>();

function getPluralRules(locale: string): Intl.PluralRules {
  let rules = pluralRules.get(locale);

  if (rules === undefined) {
    rules = new Intl.PluralRules(locale);
    pluralRules.set(locale, rules);
  }

  return rules;
}

function getNumberFormat(locale: string): Intl.NumberFormat {
  let numberFormat = numberFormats.get(locale);

  if (numberFormat === undefined) {
    numberFormat = new Intl.NumberFormat(locale);
    numberFormats.set(locale, numberFormat);
  }

  return numberFormat;
}

/**
 * Picks the form for `count` with `Intl.PluralRules` of the language.
 * A form the dictionary lacks falls back to `other`.
 */
export function selectPluralForm(locale: string, forms: PluralForms, count: number): string {
  const category: PluralCategory = getPluralRules(locale).select(count);

  return forms[category] ?? forms.other;
}

/**
 * Creates `plural` for a language: `plural(l.recipes, 5)` gives "5 recipes".
 *
 * `{:count}` is filled with the number formatted for the language
 * ("1,234" in `en`, "1 234" in `ru`); the other placeholders come from `params`.
 */
export function createPlural(locale: string): PluralFormatter {
  return (forms, count, ...args) =>
    replacePlaceholders(selectPluralForm(locale, forms, count), {
      ...args[0],
      count: getNumberFormat(locale).format(count),
    });
}
