/** Where the chosen language is remembered between visits. */
export interface LocaleStorage {
  get(): string | null;
  set(locale: string): void;
}

/**
 * Keeps the choice in `localStorage`. Storage may be unavailable (private mode,
 * blocked cookies, SSR): then nothing is remembered and nothing breaks.
 */
export function localStorageAdapter(key = "dictly.locale"): LocaleStorage {
  return {
    get() {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    set(locale) {
      try {
        globalThis.localStorage?.setItem(key, locale);
      } catch {
        // A convenience, not data: the choice then lasts until reload.
      }
    },
  };
}

export interface CookieAdapterOptions {
  /** Lifetime in seconds, a year by default. */
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
}

/** Keeps the choice in a cookie: useful when the server should know the language too. */
export function cookieAdapter(name = "locale", options: CookieAdapterOptions = {}): LocaleStorage {
  const { maxAge = 60 * 60 * 24 * 365, path = "/", sameSite = "lax" } = options;

  return {
    get() {
      if (typeof document === "undefined") return null;

      for (const part of document.cookie.split(";")) {
        const [rawName, ...rest] = part.trim().split("=");

        if (rawName === name) return decodeURIComponent(rest.join("="));
      }

      return null;
    },
    set(locale) {
      if (typeof document === "undefined") return;

      document.cookie = `${name}=${encodeURIComponent(locale)}; max-age=${maxAge}; path=${path}; samesite=${sameSite}`;
    },
  };
}
