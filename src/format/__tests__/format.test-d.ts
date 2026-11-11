import { describe, expectTypeOf, test } from "vitest";

import { createPlural, format, type Plural, type Template } from "../..";

declare const noPlaceholders: Template;
declare const countTemplate: Template<"count">;
declare const plainPlural: Plural;
declare const authorPlural: Plural<"count" | "author">;

describe("format: parameters follow the template", () => {
  test("a template without placeholders takes no params", () => {
    format("Recipes");
    format(noPlaceholders);
    // @ts-expect-error: no placeholders, no params
    format("Recipes", { x: 1 });
  });

  test("placeholders are required, extra and wrong ones are rejected", () => {
    format("{:count} of {:total}", { count: 1, total: 2 });
    format(countTemplate, { count: "1" });
    // @ts-expect-error: `total` is missing
    format("{:count} of {:total}", { count: 1 });
    // @ts-expect-error: params are required
    format("{:count} of {:total}");
    // @ts-expect-error: `extra` is not a placeholder
    format("{:count}", { count: 1, extra: 2 });
    // @ts-expect-error: values are strings or numbers
    format("{:count}", { count: true });
  });

  test("a plain string takes any params, optionally", () => {
    const untyped: string = "{:x}";
    format(untyped);
    format(untyped, { anything: 1 });
  });

  test("returns a string", () => {
    expectTypeOf(format("a")).toEqualTypeOf<string>();
  });
});

describe("plural: parameters follow the forms", () => {
  const plural = createPlural("en");

  test("{:count} is filled by plural itself", () => {
    plural({ one: "{:count} recipe", other: "{:count} recipes" }, 1);
    plural(plainPlural, 1);
  });

  test("other placeholders are required", () => {
    const forms = { one: "{:count} by {:author}", other: "{:count} by {:author}" } as const;
    plural(forms, 2, { author: "A" });
    plural(authorPlural, 2, { author: "A" });
    // @ts-expect-error: `author` is missing
    plural(forms, 2);
    // @ts-expect-error: `count` is not a parameter
    plural(forms, 2, { author: "A", count: 3 });
  });

  test("plain-string forms take any params, optionally", () => {
    const forms: { one: string; other: string } = { one: "", other: "" };
    plural(forms, 1);
    plural(forms, 1, { any: "x" });
  });
});
