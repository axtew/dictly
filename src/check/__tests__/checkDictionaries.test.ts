import { describe, expect, it } from "vitest";

import { checkDictionaries, type DictionaryIssue } from "..";

const en = {
  title: "Recipes",
  count: "{:count} of {:total}",
  recipes: { one: "{:count} recipe by {:author}", other: "{:count} recipes by {:author}" },
  menu: { title: "Menu", other: "Other" },
  steps: ["Wash", "Cut {:what}"],
};

const ru = {
  title: "Рецепты",
  count: "{:count} из {:total}",
  recipes: {
    one: "{:count} рецепт от {:author}",
    few: "{:count} рецепта от {:author}",
    many: "{:count} рецептов от {:author}",
    other: "{:count} рецепта от {:author}",
  },
  menu: { title: "Меню", other: "Другое" },
  steps: ["Помыть", "Нарезать {:what}"],
};

/** Issues of one language as `path kind` pairs: short and readable in a failing test. */
function check(dictionary: unknown, locale = "ru"): string[] {
  return checkDictionaries({ dictionaries: { en, [locale]: dictionary }, reference: "en" })
    .filter((issue) => issue.locale === locale)
    .map((issue) => `${issue.path} ${issue.kind}`);
}

describe("checkDictionaries", () => {
  it("finds nothing in correct dictionaries", () => {
    expect(checkDictionaries({ dictionaries: { en, ru }, reference: "en" })).toEqual([]);
  });

  it("reports missing and extra keys, at any depth", () => {
    const { title: _title, ...withoutTitle } = ru;

    expect(check({ ...withoutTitle, menu: { ...ru.menu, extra: "Лишнее" } })).toEqual([
      "menu.extra extra-key",
      "title missing-key",
    ]);
  });

  it("reports a node of another type", () => {
    expect(check({ ...ru, title: { nested: "Рецепты" } })).toEqual(["title wrong-type"]);
    expect(check({ ...ru, recipes: "рецепты" })).toEqual(["recipes wrong-type"]);
    expect(check({ ...ru, count: 5 })).toEqual(["count wrong-type"]);
    expect(check({ ...ru, count: null })).toEqual(["count wrong-type"]);
  });

  it("reports empty strings, also in the reference", () => {
    expect(check({ ...ru, title: "  " })).toEqual(["title empty"]);
    expect(check({ ...en, title: "" }, "en")).toEqual(["title empty"]);
  });

  it("reports missing and extra placeholders", () => {
    expect(check({ ...ru, count: "{:count} из {:all}" })).toEqual([
      "count missing-placeholder",
      "count extra-placeholder",
    ]);
  });

  it("checks placeholders in array items", () => {
    expect(check({ ...ru, steps: ["Помыть", "Нарезать"] })).toEqual([
      "steps.1 missing-placeholder",
    ]);
  });

  it("does not require {:count} in a plural form, but requires the other placeholders", () => {
    const recipes = { ...ru.recipes, one: "один рецепт от {:author}" };
    expect(check({ ...ru, recipes })).toEqual([]);

    const withoutAuthor = { ...ru.recipes, few: "{:count} рецепта" };
    expect(check({ ...ru, recipes: withoutAuthor })).toEqual(["recipes.few missing-placeholder"]);
  });

  it("reports plural forms the language needs or never uses", () => {
    const { few: _few, ...withoutFew } = ru.recipes;
    expect(check({ ...ru, recipes: withoutFew })).toEqual(["recipes.few missing-plural-form"]);

    const withTwo = { ...ru.recipes, two: "{:count} рецепта от {:author}" };
    expect(check({ ...ru, recipes: withTwo })).toEqual(["recipes.two unused-plural-form"]);
  });

  it("knows the plural forms of each language, also of the reference", () => {
    const enRecipes = { other: "{:count} recipes by {:author}" };
    expect(check({ ...en, recipes: enRecipes }, "en")).toEqual(["recipes.one missing-plural-form"]);
  });

  it("uses the Intl locale map to know the forms", () => {
    const issues = checkDictionaries({
      dictionaries: { en, custom: ru },
      reference: "en",
      intlLocales: { custom: "ru-RU" },
    });

    expect(issues).toEqual([]);
  });

  it("tells a section with an `other` key from plural forms by the other keys", () => {
    expect(check({ ...ru, menu: { title: "Меню" } })).toEqual(["menu.other missing-key"]);
    // Only `other` left: by the rule shared with the types it reads as plural forms.
    expect(check({ ...ru, menu: { other: "Другое" } })).toEqual(["menu wrong-type"]);
  });

  it("describes each issue in words", () => {
    const [issue] = checkDictionaries({
      dictionaries: { en, ru: { ...ru, count: "{:count}" } },
      reference: "en",
    });

    expect(issue).toEqual<DictionaryIssue>({
      locale: "ru",
      path: "count",
      kind: "missing-placeholder",
      message: "{:total} is missing",
    });
  });
});
