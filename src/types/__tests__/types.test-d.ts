import { describe, expectTypeOf, test } from "vitest";

import type {
  Dictionary,
  FormatArgs,
  Placeholders,
  Plural,
  PluralForms,
  Template,
  Translation,
} from "..";
import type { IsPluralForms } from "../_plural";

const en = {
  title: "Recipes",
  count: "{:count} of {:total}",
  byline: "{:count} recipes by {:author}",
  repeated: "{:n} and {:n} again",
  recipes: { one: "One recipe", other: "{:count} recipes" },
  nested: { deep: { label: "Hello, {:name}" } },
  steps: ["Wash", "Cut {:what}"],
} as const;

type En = typeof en;

describe("Placeholders", () => {
  test("are parsed from a string literal", () => {
    expectTypeOf<Placeholders<"{:count} of {:total}">>().toEqualTypeOf<"count" | "total">();
    expectTypeOf<Placeholders<"{:n} and {:n}">>().toEqualTypeOf<"n">();
    expectTypeOf<Placeholders<"no placeholders">>().toEqualTypeOf<never>();
    expectTypeOf<Placeholders<"broken {:name">>().toEqualTypeOf<never>();
  });

  test("come from a Template", () => {
    expectTypeOf<Placeholders<Template<"a" | "b">>>().toEqualTypeOf<"a" | "b">();
    expectTypeOf<Placeholders<Template>>().toEqualTypeOf<never>();
  });

  test("are unknown for a plain string", () => {
    expectTypeOf<Placeholders<string>>().toEqualTypeOf<string>();
  });
});

describe("FormatArgs", () => {
  test("no placeholders: no params", () => {
    expectTypeOf<FormatArgs<never, string>>().toEqualTypeOf<[]>();
  });

  test("known placeholders: exactly those params, required", () => {
    expectTypeOf<FormatArgs<"a" | "b", number>>().toEqualTypeOf<
      [params: { readonly a: number; readonly b: number }]
    >();
  });

  test("unknown placeholders: any params, optional", () => {
    expectTypeOf<FormatArgs<string, number>>().toEqualTypeOf<[params?: Record<string, number>]>();
  });
});

describe("IsPluralForms", () => {
  test("recognises plural forms", () => {
    expectTypeOf<IsPluralForms<{ one: "a"; other: "b" }>>().toEqualTypeOf<true>();
    expectTypeOf<IsPluralForms<{ other: "b" }>>().toEqualTypeOf<true>();
    expectTypeOf<IsPluralForms<PluralForms>>().toEqualTypeOf<true>();
    expectTypeOf<IsPluralForms<Plural<"count" | "x">>>().toEqualTypeOf<true>();
    expectTypeOf<
      IsPluralForms<{ one: string; few: string; many: string; other: string }>
    >().toEqualTypeOf<true>();
  });

  test("leaves sections alone", () => {
    expectTypeOf<IsPluralForms<{ one: "a" }>>().toEqualTypeOf<false>();
    expectTypeOf<IsPluralForms<{ title: "a"; other: "b" }>>().toEqualTypeOf<false>();
    expectTypeOf<IsPluralForms<{ other: { deep: "b" } }>>().toEqualTypeOf<false>();
    expectTypeOf<IsPluralForms<"other">>().toEqualTypeOf<false>();
  });
});

describe("Dictionary", () => {
  type D = Dictionary<En>;

  test("keeps the shape and turns literals into templates", () => {
    expectTypeOf<D["title"]>().toEqualTypeOf<Template>();
    expectTypeOf<D["count"]>().toEqualTypeOf<Template<"count" | "total">>();
    expectTypeOf<D["nested"]["deep"]["label"]>().toEqualTypeOf<Template<"name">>();
  });

  test("does not claim the reference text", () => {
    expectTypeOf<D["title"]>().not.toEqualTypeOf<"Recipes">();
    expectTypeOf<"Рецепты">().toExtend<D["title"]>();
  });

  test("templates are usable as strings", () => {
    expectTypeOf<D["title"]>().toExtend<string>();
  });

  test("turns plural forms into Plural with the placeholders of all forms", () => {
    expectTypeOf<D["recipes"]>().toEqualTypeOf<Plural>();
  });

  test("keeps tuples", () => {
    expectTypeOf<D["steps"][1]>().toEqualTypeOf<Template<"what">>();
  });

  test("a JSON-like dictionary with plain strings stays untyped", () => {
    type Json = { title: string; recipes: { one: string; other: string } };
    expectTypeOf<Dictionary<Json>["title"]>().toEqualTypeOf<string>();
    expectTypeOf<Dictionary<Json>["recipes"]>().toEqualTypeOf<Plural<string>>();
  });

  test("an interface with explicit templates keeps them", () => {
    interface Declared {
      count: Template<"count">;
      recipes: Plural<"count" | "author">;
    }
    expectTypeOf<Dictionary<Declared>["count"]>().toEqualTypeOf<Template<"count">>();
    expectTypeOf<Dictionary<Declared>["recipes"]>().toEqualTypeOf<Plural<"count" | "author">>();
  });
});

describe("Translation", () => {
  test("accepts a correct translation, placeholders in any order", () => {
    const ru = {
      title: "Рецепты",
      count: "{:total}: {:count}",
      byline: "{:author}, рецептов: {:count}",
      repeated: "{:n} и снова {:n}",
      recipes: {
        one: "{:count} рецепт",
        few: "{:count} рецепта",
        many: "{:count} рецептов",
        other: "{:count} рецепта",
      },
      nested: { deep: { label: "Привет, {:name}" } },
      steps: ["Помыть", "Нарезать {:what}"],
    } as const satisfies Translation<En>;

    expectTypeOf(ru).toExtend<Translation<En>>();
  });

  test("checks without `as const` too: satisfies keeps the literals", () => {
    const ru = {
      title: "Рецепты",
      count: "{:count} из {:total}",
      byline: "{:count} рецептов от {:author}",
      repeated: "{:n} {:n}",
      recipes: { other: "рецептов: {:count}" },
      nested: { deep: { label: "Привет, {:name}" } },
      steps: ["Помыть", "Нарезать {:what}"],
    } satisfies Translation<En>;

    expectTypeOf(ru).toExtend<Translation<En>>();
  });

  test("rejects a missing placeholder", () => {
    type T = Translation<En>["count"];
    expectTypeOf<"{:count} из {:total}">().toExtend<T>();
    expectTypeOf<"{:count} из">().not.toExtend<T>();
    expectTypeOf<"из {:total}">().not.toExtend<T>();
  });

  test("rejects a missing key and an extra key", () => {
    const missing = {
      title: "Рецепты",
    } as const;
    expectTypeOf(missing).not.toExtend<Translation<En>>();

    // Excess properties are reported for object literals, the way locale files are written.
    // @ts-expect-error: `unknownKey` is not in the reference
    void ({ title: "a", unknownKey: "b" } satisfies Translation<{ title: "x" }>);
  });

  test("plural forms: other is required, count is not, other placeholders are", () => {
    type T = Translation<{
      items: { one: "{:count} item by {:who}"; other: "{:count} items by {:who}" };
    }>;
    expectTypeOf<{ items: { other: "много от {:who}" } }>().toExtend<T>();
    expectTypeOf<{
      items: { one: "один от {:who}"; few: "{:count} от {:who}"; other: "от {:who}" };
    }>().toExtend<T>();
    expectTypeOf<{ items: { one: "один от {:who}" } }>().not.toExtend<T>();
    expectTypeOf<{ items: { other: "много" } }>().not.toExtend<T>();
  });

  test("a section is not mistaken for plural forms", () => {
    type T = Translation<{ menu: { title: "Menu"; other: "Other" } }>;
    expectTypeOf<{ menu: { title: "Меню"; other: "Другое" } }>().toExtend<T>();
    expectTypeOf<{ menu: { other: "Другое" } }>().not.toExtend<T>();
  });

  test("a plain-string reference accepts any string", () => {
    expectTypeOf<{ title: "что угодно {:x}" }>().toExtend<Translation<{ title: string }>>();
  });
});
