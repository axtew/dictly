// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createI18n } from "..";
import { deferred, memoryStorage, setBrowserLanguages } from "./_helpers";
import en from "./fixtures/en";
import ru from "./fixtures/ru";

const quiet = () => undefined;
const resolved =
  <T>(value: T) =>
  () =>
    Promise.resolve(value);

beforeEach(() => {
  setBrowserLanguages(["en-US"]);
  document.documentElement.lang = "";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loading", () => {
  it("unwraps a module from import() and keeps a `default` section of a plain object", async () => {
    const i18n = createI18n({
      locales: { en: () => import("./fixtures/en"), ru: resolved(ru) },
      defaultLocale: "en",
      storage: null,
    });

    await i18n.ready;
    expect(i18n.dictionary).toEqual(en);

    await i18n.setLocale("ru");
    expect(i18n.dictionary?.default.label).toBe(ru.default.label);
  });

  it("is loading until the first dictionary arrives, then ready", async () => {
    const load = deferred<typeof en>();
    const i18n = createI18n({
      locales: { en: () => load.promise },
      defaultLocale: "en",
      storage: null,
    });

    expect(i18n.status).toBe("loading");
    expect(i18n.dictionary).toBeNull();

    load.resolve(en);
    await i18n.ready;

    expect(i18n.status).toBe("ready");
    expect(i18n.dictionary?.title).toBe("Recipes");
  });

  it("sets <html lang> to the Intl locale, unless turned off", async () => {
    const i18n = createI18n({
      locales: { en: resolved(en) },
      defaultLocale: "en",
      intlLocales: { en: "en-GB" },
      storage: null,
    });
    await i18n.ready;
    expect(document.documentElement.lang).toBe("en-GB");

    document.documentElement.lang = "xx";
    const silent = createI18n({
      locales: { en: resolved(en) },
      defaultLocale: "en",
      htmlLang: false,
      storage: null,
    });
    await silent.ready;
    expect(document.documentElement.lang).toBe("xx");
  });

  it("rejects a default locale that is not in locales", () => {
    expect(() =>
      // @ts-expect-error: "de" is not a locale
      createI18n({ locales: { en: resolved(en) }, defaultLocale: "de" }),
    ).toThrow(/defaultLocale/);
  });
});

describe("initial language", () => {
  const locales = { en: resolved(en), ru: resolved(ru) };

  it("follows the browser: the whole preference list, by base language", async () => {
    setBrowserLanguages(["de-DE", "ru-RU", "en"]);
    const i18n = createI18n({ locales, defaultLocale: "en", storage: memoryStorage() });

    await i18n.ready;
    expect(i18n.locale).toBe("ru");
  });

  it("prefers the stored choice to the browser", async () => {
    setBrowserLanguages(["ru"]);
    const i18n = createI18n({ locales, defaultLocale: "en", storage: memoryStorage("en") });

    await i18n.ready;
    expect(i18n.locale).toBe("en");
  });

  it("ignores a stored value that is not a locale", async () => {
    setBrowserLanguages(["ru"]);
    const i18n = createI18n({ locales, defaultLocale: "en", storage: memoryStorage("klingon") });

    await i18n.ready;
    expect(i18n.locale).toBe("ru");
  });

  it("prefers initialLocale to everything", async () => {
    setBrowserLanguages(["en"]);
    const i18n = createI18n({
      locales,
      defaultLocale: "en",
      initialLocale: "ru",
      storage: memoryStorage("en"),
    });

    await i18n.ready;
    expect(i18n.locale).toBe("ru");
  });

  it("falls back to the default language without detection or a match", async () => {
    setBrowserLanguages(["ru"]);
    const noDetect = createI18n({ locales, defaultLocale: "en", detect: false, storage: null });
    setBrowserLanguages(["de"]);
    const noMatch = createI18n({ locales, defaultLocale: "en", storage: null });

    await Promise.all([noDetect.ready, noMatch.ready]);
    expect(noDetect.locale).toBe("en");
    expect(noMatch.locale).toBe("en");
  });

  it("does not store a detected language: it is not a choice", async () => {
    setBrowserLanguages(["ru"]);
    const storage = memoryStorage();
    const i18n = createI18n({ locales, defaultLocale: "en", storage });

    await i18n.ready;
    expect(storage.value).toBeNull();
  });
});

describe("switching", () => {
  it("keeps the previous dictionary on screen while the next one loads", async () => {
    const ruLoad = deferred<typeof ru>();
    const i18n = createI18n({
      locales: { en: resolved(en), ru: () => ruLoad.promise },
      defaultLocale: "en",
      storage: null,
    });
    await i18n.ready;

    const switching = i18n.setLocale("ru");

    expect(i18n.locale).toBe("en");
    expect(i18n.pendingLocale).toBe("ru");
    expect(i18n.dictionary?.title).toBe("Recipes");
    expect(i18n.status).toBe("ready");

    ruLoad.resolve(ru);
    await switching;

    expect(i18n.locale).toBe("ru");
    expect(i18n.pendingLocale).toBeNull();
    expect(i18n.dictionary?.title).toBe("Рецепты");
  });

  it("switches back at once: loaded dictionaries are cached", async () => {
    const ruLoader = vi.fn<() => Promise<typeof ru>>(resolved(ru));
    const i18n = createI18n({
      locales: { en: resolved(en), ru: ruLoader },
      defaultLocale: "en",
      storage: null,
    });
    await i18n.ready;
    await i18n.setLocale("ru");
    await i18n.setLocale("en");

    void i18n.setLocale("ru");

    expect(i18n.locale).toBe("ru");
    expect(ruLoader).toHaveBeenCalledTimes(1);
  });

  it("loads a language once when it is requested twice", async () => {
    const ruLoad = deferred<typeof ru>();
    const ruLoader = vi.fn<() => Promise<typeof ru>>(() => ruLoad.promise);
    const i18n = createI18n({
      locales: { en: resolved(en), ru: ruLoader },
      defaultLocale: "en",
      storage: null,
    });
    await i18n.ready;

    const first = i18n.setLocale("ru");
    const second = i18n.setLocale("ru");
    ruLoad.resolve(ru);
    await Promise.all([first, second]);

    expect(ruLoader).toHaveBeenCalledTimes(1);
    expect(i18n.locale).toBe("ru");
  });

  it("applies only the latest request when a slow load finishes late", async () => {
    const ruLoad = deferred<typeof ru>();
    const i18n = createI18n({
      locales: { en: resolved(en), ru: () => ruLoad.promise },
      defaultLocale: "en",
      storage: null,
    });
    await i18n.ready;

    const toRussian = i18n.setLocale("ru");
    await i18n.setLocale("en");
    ruLoad.resolve(ru);
    await toRussian;

    expect(i18n.locale).toBe("en");
    expect(i18n.pendingLocale).toBeNull();
    expect(i18n.dictionary?.title).toBe("Recipes");
  });

  it("stores an explicit choice once it is on screen", async () => {
    const storage = memoryStorage();
    const ruLoad = deferred<typeof ru>();
    const i18n = createI18n({
      locales: { en: resolved(en), ru: () => ruLoad.promise },
      defaultLocale: "en",
      storage,
    });
    await i18n.ready;

    const switching = i18n.setLocale("ru");
    expect(storage.value).toBeNull();

    ruLoad.resolve(ru);
    await switching;
    expect(storage.value).toBe("ru");
  });

  it("throws on an unknown locale", async () => {
    const i18n = createI18n({ locales: { en: resolved(en) }, defaultLocale: "en", storage: null });

    // @ts-expect-error: "de" is not a locale
    await expect(i18n.setLocale("de")).rejects.toThrow(/unknown locale/);
  });
});

describe("failures", () => {
  it("keeps the current dictionary, reports the error, and retries on the next call", async () => {
    const onError = vi.fn<(error: unknown, locale: string) => void>();
    const ruLoader = vi
      .fn<() => Promise<typeof ru>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(ru);
    const i18n = createI18n({
      locales: { en: resolved(en), ru: ruLoader },
      defaultLocale: "en",
      storage: null,
      onError,
    });
    await i18n.ready;

    await i18n.setLocale("ru");

    expect(i18n.locale).toBe("en");
    expect(i18n.dictionary?.title).toBe("Recipes");
    expect(i18n.status).toBe("ready");
    expect(i18n.pendingLocale).toBeNull();
    expect(i18n.error).toBeInstanceOf(Error);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), "ru");

    await i18n.setLocale("ru");

    expect(i18n.locale).toBe("ru");
    expect(i18n.error).toBeNull();
  });

  it("falls back to the default language when the first one fails", async () => {
    setBrowserLanguages(["ru"]);
    const i18n = createI18n({
      locales: { en: resolved(en), ru: () => Promise.reject(new Error("404")) },
      defaultLocale: "en",
      storage: null,
      onError: quiet,
    });

    await i18n.ready;

    expect(i18n.locale).toBe("en");
    expect(i18n.status).toBe("ready");
  });

  it("is in the error state when even the default language fails, and can retry", async () => {
    const enLoader = vi
      .fn<() => Promise<typeof en>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(en);
    const i18n = createI18n({
      locales: { en: enLoader },
      defaultLocale: "en",
      storage: null,
      onError: quiet,
    });

    await i18n.ready;
    expect(i18n.status).toBe("error");
    expect(i18n.dictionary).toBeNull();

    await i18n.setLocale("en");
    expect(i18n.status).toBe("ready");
  });

  it("reports errors to the console by default", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(quiet);
    const i18n = createI18n({
      locales: { en: () => Promise.reject(new Error("offline")) },
      defaultLocale: "en",
      storage: null,
    });

    await i18n.ready;
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining("en"), expect.any(Error));
  });
});

describe("store", () => {
  it("notifies subscribers on every change and stops after unsubscribe", async () => {
    const i18n = createI18n({
      locales: { en: resolved(en), ru: resolved(ru) },
      defaultLocale: "en",
      storage: null,
    });
    const listener = vi.fn<() => void>();
    const unsubscribe = i18n.subscribe(listener);

    await i18n.ready;
    expect(listener).toHaveBeenCalled();

    listener.mockClear();
    unsubscribe();
    await i18n.setLocale("ru");
    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps the snapshot identity until something changes", async () => {
    const i18n = createI18n({ locales: { en: resolved(en) }, defaultLocale: "en", storage: null });
    await i18n.ready;

    expect(i18n.getSnapshot()).toBe(i18n.getSnapshot());
  });

  it("preloads without switching", async () => {
    const ruLoader = vi.fn<() => Promise<typeof ru>>(resolved(ru));
    const i18n = createI18n({
      locales: { en: resolved(en), ru: ruLoader },
      defaultLocale: "en",
      storage: null,
    });
    await i18n.ready;
    await i18n.preload("ru");

    expect(i18n.locale).toBe("en");
    void i18n.setLocale("ru");
    expect(i18n.locale).toBe("ru");
    expect(ruLoader).toHaveBeenCalledTimes(1);
  });
});

describe("formatters", () => {
  it("follow the language on screen, through the Intl locale map", async () => {
    const i18n = createI18n({
      locales: { en: resolved(en), ru: resolved(ru) },
      defaultLocale: "en",
      intlLocales: { en: "en-US" },
      storage: null,
    });
    await i18n.ready;

    expect(i18n.formatters.locale).toBe("en-US");
    expect(i18n.formatters.number(1234.5)).toBe("1,234.5");
    expect(i18n.plural(i18n.dictionary!.recipes, 2)).toBe("2 recipes");

    await i18n.setLocale("ru");

    expect(i18n.formatters.number(1234.5)).toBe("1 234,5");
    expect(i18n.plural(i18n.dictionary!.recipes, 5)).toBe("5 рецептов");
    expect(i18n.formatters.list(["a", "b", "c"])).toBe("a, b и c");
  });
});
