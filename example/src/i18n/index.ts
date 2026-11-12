import { createI18n, type Translation } from "dictly";
import { checkDictionaries } from "dictly/check";
import { createI18nReact } from "dictly/react";

import type en from "./dictionaries/en";

/** Native names: the same in every language, so they live outside the dictionaries. */
export const LANGUAGE_NAMES = {
  en: "English",
  ru: "Русский",
  de: "Deutsch",
} as const;

export const DE_DICTIONARY_PATH = "/dictionaries/de.json";

let slowNetwork = false;

/** The demo's "Slow network" switch: delays the first load of a language. */
export function setSlowNetwork(value: boolean): void {
  slowNetwork = value;
}

function delayed<T>(load: () => Promise<T>): () => Promise<T> {
  return async () => {
    if (slowNetwork) await new Promise((resolve) => setTimeout(resolve, 1500));

    return load();
  };
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);

  // The shape is trusted here; `validate` compares it with the reference dictionary in development.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return (await response.json()) as T;
}

export const i18n = createI18n({
  locales: {
    // TS modules: each language is its own chunk, loaded when it is picked.
    en: delayed(() => import("./dictionaries/en")),
    ru: delayed(() => import("./dictionaries/ru")),
    // JSON from a server: no types at runtime, so `validate` checks it in development.
    de: delayed(() => fetchJson<Translation<typeof en>>(DE_DICTIONARY_PATH)),
  },
  defaultLocale: "en",
  // In production the condition is false and the checker is left out of the build.
  validate: import.meta.env.DEV && checkDictionaries,
});

export type Locale = (typeof i18n.locales)[number];

export const { I18nProvider, useT, useLocale, useFormatters } = createI18nReact(i18n);
