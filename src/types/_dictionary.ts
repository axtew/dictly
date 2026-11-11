import type { IsPluralForms, Plural, PluralPlaceholders, PluralTranslation } from "./_plural";
import type { LeafTemplate, Placeholders, WithPlaceholders } from "./_template";

/**
 * How the code sees a dictionary: the shape of the reference language,
 * with string leaves turned into `Template` (placeholders are kept, the
 * English text is not) and plural forms into `Plural`.
 */
export type Dictionary<T> = T extends string
  ? LeafTemplate<T>
  : IsPluralForms<T> extends true
    ? Plural<PluralPlaceholders<T> & string>
    : T extends object
      ? { readonly [K in keyof T]: Dictionary<T[K]> }
      : T;

/**
 * The shape another language must have, checked with
 * `export default { ... } as const satisfies Translation<typeof en>`:
 * the same keys, and every placeholder of the reference in each string.
 */
export type Translation<T> = T extends string
  ? WithPlaceholders<Placeholders<T>>
  : IsPluralForms<T> extends true
    ? PluralTranslation<Exclude<PluralPlaceholders<T>, "count">>
    : T extends object
      ? { readonly [K in keyof T]: Translation<T[K]> }
      : T;
