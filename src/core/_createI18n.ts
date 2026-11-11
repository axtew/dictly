import type { DictionaryIssue } from "../check";
import { getFormatters } from "../format";
import type { Dictionary } from "../types";
import { getBrowserLanguages, matchLocale } from "./_detect";
import { localStorageAdapter } from "./_storage";
import type { DictionaryLoader, I18n, I18nOptions, I18nSnapshot, LoadedDictionary } from "./_types";

/**
 * A module namespace from `import()` is unwrapped to its default export; any
 * other value is the dictionary itself. A namespace is recognised by its
 * `Module` tag or its null prototype (bundlers that emulate namespaces keep one
 * of the two), not by a `default` key: a dictionary may have its own `default` section.
 */
function unwrapModule(loaded: unknown): unknown {
  if (
    typeof loaded === "object" &&
    loaded !== null &&
    (Reflect.get(loaded, Symbol.toStringTag) === "Module" ||
      Object.getPrototypeOf(loaded) === null) &&
    "default" in loaded
  ) {
    return loaded.default;
  }

  return loaded;
}

/**
 * Creates the i18n store: the language on screen, its dictionary and formatters,
 * loading with a cache, protection against races and a retry after a failure.
 * Framework-agnostic: React reads it through `dictly/react`, any other code
 * through `getSnapshot` and `subscribe`.
 */
export function createI18n<
  const M extends Record<string, DictionaryLoader>,
  R extends keyof M & string,
>(options: I18nOptions<M, R>): I18n<LoadedDictionary<M[R]>, keyof M & string> {
  type L = keyof M & string;
  type D = LoadedDictionary<M[R]>;

  const {
    locales: loaders,
    defaultLocale,
    initialLocale,
    storage = localStorageAdapter(),
    detect = true,
    htmlLang = true,
    onError = (error: unknown, locale: L) =>
      console.error(`dictly: failed to load the "${locale}" dictionary`, error),
    validate = false,
  } = options;

  const reportIssues =
    typeof validate === "function"
      ? validate
      : (issues: DictionaryIssue[], locale: L) =>
          console.warn(`dictly: ${issues.length} problem(s) in the "${locale}" dictionary`, issues);

  const locales = Object.keys(loaders) as L[];

  if (!locales.includes(defaultLocale)) {
    throw new Error(`dictly: defaultLocale "${defaultLocale}" is not in locales`);
  }

  const isLocale = (value: unknown): value is L => locales.some((locale) => locale === value);
  const getIntlLocale = (locale: L): string => options.intlLocales?.[locale] ?? locale;

  const loaded = new Map<L, Dictionary<D>>();
  const inFlight = new Map<L, Promise<Dictionary<D>>>();
  const listeners = new Set<() => void>();

  /** Only the latest request may change the screen: an older one finishing later is ignored. */
  let latestRequest = 0;

  function pickInitialLocale(): L {
    if (initialLocale !== undefined && isLocale(initialLocale)) return initialLocale;

    const stored = storage?.get();

    if (isLocale(stored)) return stored;

    if (detect) {
      const detected = matchLocale(getBrowserLanguages(), locales);

      if (detected !== undefined) return detected;
    }

    return defaultLocale;
  }

  const startLocale = pickInitialLocale();

  /**
   * The current state. Never mutated, replaced as a whole on every change:
   * `getSnapshot` must return the same object until something changes and a
   * new one after (the `useSyncExternalStore` contract). No history is kept.
   */
  let state: I18nSnapshot<D, L> = {
    locale: startLocale,
    dictionary: null,
    pendingLocale: null,
    status: "loading",
    error: null,
    formatters: getFormatters(getIntlLocale(startLocale)),
  };

  function update(patch: Partial<I18nSnapshot<D, L>>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  function load(locale: L): Promise<Dictionary<D>> {
    const ready = loaded.get(locale);

    if (ready !== undefined) return Promise.resolve(ready);

    let request = inFlight.get(locale);

    if (request === undefined) {
      const loader: DictionaryLoader | undefined = loaders[locale];

      if (loader === undefined) {
        return Promise.reject(new Error(`dictly: no loader for "${locale}"`));
      }

      request = loader()
        .then((result) => {
          // The loader is trusted to return the dictionary of its type, as an import would.
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          const dictionary = unwrapModule(result) as Dictionary<D>;

          loaded.set(locale, dictionary);

          if (validate !== false) void validateLocale(locale, dictionary);

          return dictionary;
        })
        .finally(() => inFlight.delete(locale));

      inFlight.set(locale, request);
    }

    return request;
  }

  /**
   * Compares a loaded dictionary with the reference one (the default language),
   * loading the reference if needed. Off by default: meant for development and
   * for dictionaries from a server. A failure here never affects the screen.
   * The checker is imported on demand, so an app without `validate` does not ship it.
   */
  async function validateLocale(locale: L, dictionary: Dictionary<D>): Promise<void> {
    try {
      const { checkDictionaries } = await import("../check");
      const reference = locale === defaultLocale ? dictionary : await load(defaultLocale);
      const issues = checkDictionaries({
        dictionaries: { [defaultLocale]: reference, [locale]: dictionary },
        reference: defaultLocale,
        intlLocales: {
          [defaultLocale]: getIntlLocale(defaultLocale),
          [locale]: getIntlLocale(locale),
        },
      }).filter((issue) => issue.locale === locale);

      if (issues.length > 0) reportIssues(issues, locale);
    } catch {
      // The reference failed to load: that is reported by the loading itself.
    }
  }

  function show(locale: L, dictionary: Dictionary<D>) {
    if (htmlLang && typeof document !== "undefined") {
      document.documentElement.lang = getIntlLocale(locale);
    }

    update({
      locale,
      dictionary,
      pendingLocale: null,
      status: "ready",
      error: null,
      formatters: getFormatters(getIntlLocale(locale)),
    });
  }

  async function setLocale(locale: L): Promise<void> {
    if (!isLocale(locale)) {
      throw new Error(`dictly: unknown locale "${String(locale)}"`);
    }

    const request = ++latestRequest;
    const ready = loaded.get(locale);

    if (ready !== undefined) {
      show(locale, ready);
      storage?.set(locale);

      return;
    }

    if (state.dictionary === null) {
      update({ locale, status: "loading", error: null });
    } else {
      update({ pendingLocale: locale });
    }

    try {
      const dictionary = await load(locale);

      if (request !== latestRequest) return;

      show(locale, dictionary);
      storage?.set(locale);
    } catch (error) {
      onError(error, locale);

      if (request !== latestRequest) return;

      update({
        pendingLocale: null,
        error,
        status: state.dictionary === null ? "error" : "ready",
      });
    }
  }

  /**
   * The first language is not stored (it may come from detection, not a choice).
   * If it fails and is not the default one, the default language is tried,
   * so a broken translation does not leave the app without any text.
   */
  async function start(): Promise<void> {
    const request = ++latestRequest;

    try {
      const dictionary = await load(startLocale);

      if (request === latestRequest) show(startLocale, dictionary);
    } catch (error) {
      onError(error, startLocale);

      if (request !== latestRequest) return;

      if (startLocale === defaultLocale) {
        update({ status: "error", error });

        return;
      }

      update({ locale: defaultLocale, error });
      await setLocale(defaultLocale);
    }
  }

  const ready = start();

  return {
    get locale() {
      return state.locale;
    },
    get dictionary() {
      return state.dictionary;
    },
    get pendingLocale() {
      return state.pendingLocale;
    },
    get status() {
      return state.status;
    },
    get error() {
      return state.error;
    },
    get formatters() {
      return state.formatters;
    },
    get plural() {
      return state.formatters.plural;
    },
    locales,
    defaultLocale,
    ready,
    setLocale,
    preload: (locale) =>
      load(locale).then(
        () => undefined,
        (error: unknown) => onError(error, locale),
      ),
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
  };
}
