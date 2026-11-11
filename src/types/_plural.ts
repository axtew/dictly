import type { Placeholders, WithPlaceholders } from "./_template";

declare const pluralPlaceholders: unique symbol;

/** CLDR plural categories, the ones `Intl.PluralRules` returns. */
export type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

/**
 * Plural forms of one phrase. `other` is required in every language,
 * the rest depends on the language (`ru` uses one / few / many / other).
 */
export type PluralForms = { readonly other: string } & {
  readonly [K in Exclude<PluralCategory, "other">]?: string;
};

/** Plural forms with the placeholder names of all forms in the type. `{:count}` is filled by `plural`. */
export type Plural<P extends string = "count"> = PluralForms & {
  readonly [pluralPlaceholders]?: P;
};

/**
 * Whether a dictionary node is a set of plural forms and not a section:
 * every key is a plural category, `other` is present and every value is a string.
 */
export type IsPluralForms<T> = T extends object
  ? [Exclude<keyof T, PluralCategory | typeof pluralPlaceholders>] extends [never]
    ? "other" extends keyof T
      ? [Exclude<T[Exclude<keyof T, symbol>], undefined>] extends [string]
        ? true
        : false
      : false
    : false
  : false;

/**
 * Placeholder names used in any of the forms. The brand is checked through `keyof`:
 * every object matches an optional property, so `T extends { [brand]?: infer P }`
 * would accept plain forms too and give `unknown`.
 */
export type PluralPlaceholders<T> = typeof pluralPlaceholders extends keyof T
  ? Exclude<T[typeof pluralPlaceholders], undefined> & string
  : { [K in Exclude<keyof T, symbol>]: Placeholders<T[K]> }[Exclude<keyof T, symbol>];

/**
 * Plural forms in another language: `other` is required, the other categories
 * are optional (which of them a language needs is checked by `checkDictionaries`).
 * Each form must contain every placeholder of the reference except `{:count}`:
 * the singular form often names no number ("a recipe").
 */
export type PluralTranslation<P> = { readonly other: WithPlaceholders<P> } & {
  readonly [K in Exclude<PluralCategory, "other">]?: WithPlaceholders<P>;
};
