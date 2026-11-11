// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { cookieAdapter, localStorageAdapter, matchLocale } from "..";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.cookie = "locale=; max-age=0; path=/";
});

describe("localStorageAdapter", () => {
  it("keeps the choice under its key", () => {
    const storage = localStorageAdapter("app.locale");

    expect(storage.get()).toBeNull();
    storage.set("ru");
    expect(storage.get()).toBe("ru");
    expect(localStorage.getItem("app.locale")).toBe("ru");
  });

  it("does not break when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const storage = localStorageAdapter();

    expect(() => storage.set("ru")).not.toThrow();
    expect(storage.get()).toBeNull();
  });
});

describe("cookieAdapter", () => {
  it("keeps the choice in a cookie", () => {
    const storage = cookieAdapter();

    expect(storage.get()).toBeNull();
    storage.set("pt-BR");
    expect(storage.get()).toBe("pt-BR");
    expect(document.cookie).toContain("locale=pt-BR");
  });

  it("reads its own cookie among others", () => {
    document.cookie = "theme=dark; path=/";
    document.cookie = "lang=ru; path=/";

    expect(cookieAdapter("lang").get()).toBe("ru");
  });
});

describe("matchLocale", () => {
  const locales = ["en", "ru", "pt-BR"] as const;

  it("matches an exact tag, ignoring case", () => {
    expect(matchLocale(["PT-br"], locales)).toBe("pt-BR");
  });

  it("matches by the base language in both directions", () => {
    expect(matchLocale(["ru-RU"], locales)).toBe("ru");
    expect(matchLocale(["pt"], locales)).toBe("pt-BR");
  });

  it("walks the preference list in order", () => {
    expect(matchLocale(["de", "fr", "ru", "en"], locales)).toBe("ru");
  });

  it("gives nothing without a match", () => {
    expect(matchLocale(["de", "fr"], locales)).toBeUndefined();
    expect(matchLocale([], locales)).toBeUndefined();
  });
});
