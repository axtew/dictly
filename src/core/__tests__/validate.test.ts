// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createI18n, type DictionaryIssue } from "../..";
import { setBrowserLanguages } from "./_helpers";
import en from "./fixtures/en";
import ru from "./fixtures/ru";

/** A Russian dictionary from a "server": not checked by types, with a lost placeholder. */
const loadBrokenRu = (): Promise<unknown> => Promise.resolve({ ...ru, count: "{:count} из" });

beforeEach(() => {
  setBrowserLanguages(["ru"]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("validate", () => {
  it("reports problems of a loaded dictionary, loading the reference for it", async () => {
    const onIssues = vi.fn<(issues: DictionaryIssue[], locale: string) => void>();
    const enLoader = vi.fn<() => Promise<typeof en>>(() => Promise.resolve(en));
    const i18n = createI18n({
      locales: { en: enLoader, ru: loadBrokenRu },
      defaultLocale: "en",
      storage: null,
      validate: onIssues,
    });

    await i18n.ready;
    expect(i18n.locale).toBe("ru");

    await vi.waitFor(() => expect(onIssues).toHaveBeenCalledTimes(1));
    expect(onIssues).toHaveBeenCalledWith(
      [expect.objectContaining({ path: "count", kind: "missing-placeholder" })],
      "ru",
    );
    expect(enLoader).toHaveBeenCalledTimes(1);
  });

  it("warns in the console with `true`", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const i18n = createI18n({
      locales: { en: () => Promise.resolve(en), ru: loadBrokenRu },
      defaultLocale: "en",
      storage: null,
      validate: true,
    });

    await i18n.ready;
    await vi.waitFor(() => expect(warn).toHaveBeenCalledTimes(1));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"ru"'), expect.any(Array));
  });

  it("stays silent about correct dictionaries", async () => {
    const onIssues = vi.fn<(issues: DictionaryIssue[], locale: string) => void>();
    const i18n = createI18n({
      locales: { en: () => Promise.resolve(en), ru: () => Promise.resolve(ru) },
      defaultLocale: "en",
      storage: null,
      validate: onIssues,
    });

    await i18n.ready;
    await i18n.setLocale("en");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onIssues).not.toHaveBeenCalled();
  });

  it("is off by default", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const i18n = createI18n({
      locales: { en: () => Promise.resolve(en), ru: loadBrokenRu },
      defaultLocale: "en",
      storage: null,
    });

    await i18n.ready;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(warn).not.toHaveBeenCalled();
  });
});
