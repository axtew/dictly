import {
  type Context,
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useSyncExternalStore,
} from "react";

import type { I18n, I18nStatus } from "../core";
import type { Formatters } from "../format";

// `any` is deliberate: `I18n<D, L>` takes `L` in `setLocale`, so an instance with
// "en" | "ru" is not assignable to `I18n<unknown, string>`. The concrete types are
// read back from the instance below, never from these `any`s.
// oxlint-disable-next-line typescript/no-explicit-any
export type AnyI18n = I18n<any, any>;

/** The dictionary as the code sees it. */
export type DictionaryOf<I extends AnyI18n> = NonNullable<I["dictionary"]>;

export type LocaleOf<I extends AnyI18n> = I["locale"];

export interface LocaleState<L extends string> {
  /** The language on screen. */
  readonly locale: L;
  readonly locales: readonly L[];
  /** The language being loaded while the previous one stays on screen. */
  readonly pendingLocale: L | null;
  readonly status: I18nStatus;
  readonly error: unknown;
  readonly setLocale: (locale: L) => Promise<void>;
}

export interface I18nProviderProps {
  children?: ReactNode;
  /** Shown until the first dictionary arrives. Nothing by default. */
  fallback?: ReactNode;
  /**
   * Shown when no dictionary could be loaded at all. A function receives
   * `retry` and the load error. Falls back to `fallback`. There is no dictionary
   * yet, so its text cannot come from one: keep it language-neutral (an icon)
   * or pick it by `navigator.language`.
   */
  errorFallback?: ReactNode | ((retry: () => void, error: unknown) => ReactNode);
}

export interface I18nBindings<I extends AnyI18n> {
  /**
   * Selects a branch of the dictionary: `useT((l) => l.recipes.list)`.
   * Without a selector, the whole dictionary. The component updates only when
   * another dictionary is on screen, not while one is loading.
   */
  useT: {
    (): DictionaryOf<I>;
    <T>(selector: (dictionary: DictionaryOf<I>) => T): T;
  };
  /** The current language, the list of languages and `setLocale`. */
  useLocale: () => LocaleState<LocaleOf<I>>;
  /** `Intl` formatters and `plural` of the language on screen. */
  useFormatters: () => Formatters;
  /** The i18n instance itself, for what the hooks above do not cover. */
  useI18n: () => I;
}

const noInstance = (hook: string) => new Error(`dictly: ${hook} is used outside I18nProvider`);

/** The snapshot of the instance, re-read on every change. */
function useSnapshot(i18n: AnyI18n) {
  return useSyncExternalStore(i18n.subscribe, i18n.getSnapshot, i18n.getSnapshot);
}

/**
 * One field of the snapshot. React compares it with `Object.is` and skips the
 * render while it stays the same, so a component that needs only the dictionary
 * does not render when `pendingLocale`, `status` or `error` change.
 */
function useSnapshotField<K extends keyof ReturnType<AnyI18n["getSnapshot"]>>(
  i18n: AnyI18n,
  key: K,
): ReturnType<AnyI18n["getSnapshot"]>[K] {
  const read = () => i18n.getSnapshot()[key];

  return useSyncExternalStore(i18n.subscribe, read, read);
}

/**
 * Hooks over one React context. `createI18nReact` makes a context of its own
 * per instance; the hooks exported from `dictly/react` share one context typed
 * by `Register`.
 */
export function createBindings<I extends AnyI18n>(context: Context<I | null>): I18nBindings<I> {
  function useI18n(): I {
    const i18n = useContext(context);

    if (i18n === null) throw noInstance("useI18n");

    return i18n;
  }

  function useT<T>(selector?: (dictionary: DictionaryOf<I>) => T): T | DictionaryOf<I> {
    const i18n = useContext(context);

    if (i18n === null) throw noInstance("useT");

    const dictionary: unknown = useSnapshotField(i18n, "dictionary");

    if (dictionary === null) {
      throw new Error("dictly: useT is used before the dictionary is loaded");
    }

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const typed = dictionary as DictionaryOf<I>;

    return selector === undefined ? typed : selector(typed);
  }

  function useLocale(): LocaleState<LocaleOf<I>> {
    const i18n = useI18n();
    const { locale, pendingLocale, status, error } = useSnapshot(i18n);

    return {
      locale,
      locales: i18n.locales,
      pendingLocale,
      status,
      error,
      setLocale: i18n.setLocale,
    };
  }

  function useFormatters(): Formatters {
    // Formatters are cached per locale: the object changes only with the language on screen.
    return useSnapshotField(useI18n(), "formatters");
  }

  return { useT, useLocale, useFormatters, useI18n };
}

/**
 * Renders the fallbacks until a dictionary is on screen, then the children.
 * Returns an element, not any `ReactNode`: before TypeScript 5.1 a component
 * returning `ReactNode` cannot be used in JSX.
 */
export function Gate({
  i18n,
  children,
  fallback = null,
  errorFallback,
}: I18nProviderProps & { i18n: AnyI18n }): ReactElement {
  const { dictionary, status, locale, error } = useSnapshot(i18n);

  if (dictionary !== null) return <>{children}</>;

  if (status === "error" && errorFallback !== undefined) {
    const retry = () => void i18n.setLocale(locale);

    return <>{typeof errorFallback === "function" ? errorFallback(retry, error) : errorFallback}</>;
  }

  return <>{fallback}</>;
}

export function createI18nContext<I extends AnyI18n>(): Context<I | null> {
  return createContext<I | null>(null);
}
