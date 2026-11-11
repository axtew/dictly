import type { Formatters, PluralFormatter } from "../format";
import type { Dictionary } from "../types";
import type { LocaleStorage } from "./_storage";

/**
 * Loads one language. Returns the dictionary itself or a module whose default
 * export is the dictionary, so `() => import("./locales/en")` works as is.
 */
export type DictionaryLoader<D = unknown> = () => Promise<D | { default: D }>;

/**
 * The dictionary type a loader gives. A type cannot tell a module from an object,
 * so a module is a result whose only key is `default` (a locale file exports
 * the dictionary and nothing else); a dictionary with a `default` section among
 * other keys stays as is. At runtime the module is recognised by its namespace tag.
 */
export type LoadedDictionary<F> = F extends () => Promise<infer R>
  ? R extends { default: infer D }
    ? [Exclude<keyof R, "default">] extends [never]
      ? D
      : R
    : R
  : never;

export interface I18nOptions<M extends Record<string, DictionaryLoader>, R extends keyof M> {
  /**
   * A loader per language. The keys are the supported languages, in the order
   * a language switcher shows them.
   */
  locales: M;
  /**
   * Used when nothing else picks a language, and when the picked one fails to load.
   * Its dictionary is the reference: its type is the type of `dictionary`.
   */
  defaultLocale: R;
  /** Starts with this language and skips storage and detection (a language from a user profile, for example). */
  initialLocale?: keyof M & string;
  /** Where the explicit choice is kept. `localStorage` by default, `null` to keep nothing. */
  storage?: LocaleStorage | null;
  /** Picks a language from `navigator.languages` when nothing is stored. On by default. */
  detect?: boolean;
  /** `Intl` locale per language, for the formatters: `{ en: "en-GB" }`. The language key by default. */
  intlLocales?: Partial<Record<keyof M & string, string>>;
  /** Sets `<html lang>` when a dictionary is shown. On by default. */
  htmlLang?: boolean;
  /** Called when a dictionary fails to load. `console.error` by default. */
  onError?: (error: unknown, locale: keyof M & string) => void;
}

export type I18nStatus = "loading" | "ready" | "error";

/** Everything the UI shows, as one immutable object: a new one on every change. */
export interface I18nSnapshot<D, L extends string> {
  /** The language of the dictionary on screen (or being loaded first). */
  readonly locale: L;
  /** The dictionary on screen; `null` until the first one arrives. */
  readonly dictionary: Dictionary<D> | null;
  /** The language being switched to while the previous dictionary stays on screen. */
  readonly pendingLocale: L | null;
  /** `loading` before the first dictionary, `error` if it could not be loaded at all. */
  readonly status: I18nStatus;
  /** The last load error, cleared by the next successful load. */
  readonly error: unknown;
  /** `Intl` formatters and `plural` of the language on screen. */
  readonly formatters: Formatters;
}

/**
 * The i18n store. Functions are plain properties, not methods: they do not use
 * `this`, so `const { setLocale } = i18n` and `useSyncExternalStore(i18n.subscribe, ...)` are safe.
 */
export interface I18n<D, L extends string> extends I18nSnapshot<D, L> {
  readonly locales: readonly L[];
  readonly defaultLocale: L;
  /** Resolves once the first dictionary is on screen (or failed to load). Never rejects. */
  readonly ready: Promise<void>;
  /** `plural` of the language on screen: `i18n.plural(l.recipes, 5)`. */
  readonly plural: PluralFormatter;
  /**
   * Switches the language. The previous dictionary stays on screen until the
   * new one arrives; a loaded language switches at once. Resolves when done;
   * never rejects: a failure goes to `error` and `onError`, calling again retries.
   */
  setLocale: (locale: L) => Promise<void>;
  /** Loads a language in the background without switching to it. */
  preload: (locale: L) => Promise<void>;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => I18nSnapshot<D, L>;
}
