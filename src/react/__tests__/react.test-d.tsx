import "./_registered";

import type { ReactNode } from "react";
import { describe, expectTypeOf, test } from "vitest";

import { createI18n, type Dictionary, type Template } from "../..";
import type en from "../../core/__tests__/fixtures/en";
import { createI18nReact, format, useLocale, useT } from "..";

const i18n = createI18n({
  locales: {
    en: () => import("../../core/__tests__/fixtures/en"),
    ru: () => import("../../core/__tests__/fixtures/ru"),
  },
  defaultLocale: "en",
});
const bindings = createI18nReact(i18n);

describe("createI18nReact", () => {
  test("useT is typed by the instance", () => {
    expectTypeOf(bindings.useT((l) => l.count)).toEqualTypeOf<Template<"count" | "total">>();
    expectTypeOf(bindings.useT()).toEqualTypeOf<Dictionary<typeof en>>();
    // @ts-expect-error: no such key
    bindings.useT((l) => l.missing);
  });

  test("useLocale knows the languages", () => {
    const { locale, setLocale } = bindings.useLocale();
    expectTypeOf(locale).toEqualTypeOf<"en" | "ru">();
    void setLocale("ru");
    // @ts-expect-error: not a language of the instance
    void setLocale("de");
  });
});

describe("Register", () => {
  test("hooks exported from the package follow the registered instance", () => {
    expectTypeOf(useT((l) => l.title)).toEqualTypeOf<Template>();
    expectTypeOf(useLocale().locale).toEqualTypeOf<"en" | "ru">();
  });
});

describe("format (React)", () => {
  test("strings and numbers give a string", () => {
    expectTypeOf(format("{:a}", { a: 1 })).toEqualTypeOf<string>();
  });

  test("an element gives a ReactNode", () => {
    expectTypeOf(format("{:a}", { a: <b>x</b> })).toEqualTypeOf<ReactNode>();
  });

  test("placeholders are still checked", () => {
    // @ts-expect-error: `b` is missing
    format("{:a} {:b}", { a: <b>x</b> });
  });
});
