declare const placeholders: unique symbol;

/**
 * A translated string that carries the names of its `{:placeholders}` in its type.
 *
 * At runtime it is a plain string. The type only remembers which parameters
 * `format` must receive, so a dictionary in another language can be loaded
 * without the types claiming the English text.
 */
export type Template<P extends string = never> = string & { readonly [placeholders]?: P };

/** Placeholder names written in a string literal: `"{:count} of {:total}"` gives `"count" | "total"`. */
export type ParsePlaceholders<S extends string> = S extends `${string}{:${infer Name}}${infer Rest}`
  ? Name | ParsePlaceholders<Rest>
  : never;

/**
 * Placeholder names of a dictionary leaf.
 *
 * - `Template<P>` gives `P`;
 * - a string literal is parsed;
 * - a plain `string` (a JSON dictionary, for example) gives `string`: the names are unknown.
 */
export type Placeholders<S> = S extends { readonly [placeholders]?: infer P }
  ? // Older compilers (5.0) infer an optional `never` as `undefined`.
    Exclude<P, undefined>
  : S extends string
    ? string extends S
      ? string
      : ParsePlaceholders<S>
    : never;

/** Arguments of `format` after the template: none, any, or exactly the named parameters. */
export type FormatArgs<P, V> = [P] extends [never]
  ? []
  : string extends P
    ? [params?: Record<string, V>]
    : [params: { readonly [K in P & string]: V }];

/** The view of a dictionary leaf: literals become `Template`, the rest stays as is. */
export type LeafTemplate<S extends string> = S extends { readonly [placeholders]?: unknown }
  ? S
  : string extends S
    ? string
    : Template<ParsePlaceholders<S>>;

type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (
  arg: infer I,
) => void
  ? I
  : never;

/**
 * A string that contains every placeholder from `P`, in any order.
 * Used to check a translation against the reference language.
 */
export type WithPlaceholders<P> = [P] extends [never]
  ? string
  : string extends P
    ? string
    : UnionToIntersection<P extends string ? `${string}{:${P}}${string}` : never>;
