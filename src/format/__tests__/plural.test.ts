import { describe, expect, it } from "vitest";

import { createPlural, selectPluralForm } from "..";

const enForms = { one: "{:count} recipe", other: "{:count} recipes" } as const;
const ruForms = {
  one: "{:count} рецепт",
  few: "{:count} рецепта",
  many: "{:count} рецептов",
  other: "{:count} рецепта",
} as const;

describe("selectPluralForm", () => {
  it("follows the rules of English", () => {
    expect(selectPluralForm("en", enForms, 1)).toBe(enForms.one);
    expect(selectPluralForm("en", enForms, 0)).toBe(enForms.other);
    expect(selectPluralForm("en", enForms, 2)).toBe(enForms.other);
  });

  it.each([
    [1, "one"],
    [21, "one"],
    [101, "one"],
    [2, "few"],
    [4, "few"],
    [22, "few"],
    [0, "many"],
    [5, "many"],
    [11, "many"],
    [12, "many"],
    [14, "many"],
    [25, "many"],
    [111, "many"],
    [1.5, "other"],
  ] as const)("follows the rules of Russian: %s is %s", (count, category) => {
    expect(selectPluralForm("ru", ruForms, count)).toBe(ruForms[category]);
  });

  it("falls back to other when the form is missing", () => {
    expect(selectPluralForm("ru", { other: "рецептов: {:count}" }, 2)).toBe("рецептов: {:count}");
  });
});

describe("createPlural", () => {
  it("fills {:count} with the number", () => {
    const plural = createPlural("ru");

    expect(plural(ruForms, 1)).toBe("1 рецепт");
    expect(plural(ruForms, 3)).toBe("3 рецепта");
    expect(plural(ruForms, 5)).toBe("5 рецептов");
  });

  it("formats the number for the language", () => {
    expect(createPlural("en")(enForms, 1234)).toBe("1,234 recipes");
    expect(createPlural("ru")(ruForms, 1234)).toBe("1 234 рецепта");
  });

  it("allows a form without the number", () => {
    expect(createPlural("en")({ one: "A recipe", other: "{:count} recipes" }, 1)).toBe("A recipe");
  });

  it("puts the other parameters", () => {
    const forms = { one: "{:count} recipe by {:author}", other: "{:count} recipes by {:author}" };

    expect(createPlural("en")(forms, 2, { author: "Anna" })).toBe("2 recipes by Anna");
  });
});
