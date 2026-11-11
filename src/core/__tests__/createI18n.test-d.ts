import { describe, expectTypeOf, test } from "vitest";

import { createI18n, type Dictionary, type LoadedDictionary } from "../..";
import type en from "./fixtures/en";

describe("createI18n types", () => {
  const i18n = createI18n({
    locales: { en: () => import("./fixtures/en"), ru: () => import("./fixtures/ru") },
    defaultLocale: "en",
  });

  test("languages come from the loader keys", () => {
    expectTypeOf(i18n.locale).toEqualTypeOf<"en" | "ru">();
    expectTypeOf(i18n.setLocale).parameter(0).toEqualTypeOf<"en" | "ru">();
  });

  test("the dictionary type comes from the default language's loader", () => {
    expectTypeOf(i18n.dictionary).toEqualTypeOf<Dictionary<typeof en> | null>();
  });

  test("a typed fetch loader gives its type", () => {
    interface Json {
      title: string;
    }
    const fromJson = createI18n({
      locales: { en: (): Promise<Json> => fetch("/en.json").then((r) => r.json()) },
      defaultLocale: "en",
    });

    expectTypeOf(fromJson.dictionary).toEqualTypeOf<Dictionary<Json> | null>();
  });
});

describe("LoadedDictionary", () => {
  test("unwraps a module, keeps a dictionary with a `default` section", () => {
    type Section = { default: { label: string }; title: string };

    expectTypeOf<LoadedDictionary<() => Promise<{ default: Section }>>>().toEqualTypeOf<Section>();
    expectTypeOf<LoadedDictionary<() => Promise<Section>>>().toEqualTypeOf<Section>();
  });
});
