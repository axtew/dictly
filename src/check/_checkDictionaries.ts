import { parsePlaceholders } from "../format";
import type { PluralCategory } from "../types";

export type DictionaryIssueKind =
  /** A key of the reference is missing. */
  | "missing-key"
  /** A key the reference does not have. */
  | "extra-key"
  /** A string where the reference has a section or plural forms, and so on. */
  | "wrong-type"
  /** An empty or whitespace-only string. */
  | "empty"
  /** A placeholder of the reference is missing. */
  | "missing-placeholder"
  /** A placeholder the reference does not have: `format` would leave it in the text. */
  | "extra-placeholder"
  /** A plural form the language needs is missing: `other` would be used instead. */
  | "missing-plural-form"
  /** A plural form the language never uses. */
  | "unused-plural-form";

export interface DictionaryIssue {
  readonly locale: string;
  /** Dotted path to the node: `recipes.list.title`, `recipes.count.few`, `steps.1`. */
  readonly path: string;
  readonly kind: DictionaryIssueKind;
  readonly message: string;
}

/** The languages are the keys of `dictionaries`; `reference` must be one of them. */
export interface CheckDictionariesOptions<M extends Readonly<Record<string, unknown>>> {
  /** All dictionaries to check, the reference among them. */
  dictionaries: M;
  /** The language the others are compared with. */
  reference: keyof M & string;
  /** `Intl` locale per language, used to know its plural forms. The language key by default. */
  intlLocales?: Partial<Record<keyof M & string, string>>;
}

type DictionaryNode =
  | { kind: "string"; value: string }
  | { kind: "plural"; forms: Readonly<Record<string, string>> }
  | { kind: "section"; children: Readonly<Record<string, unknown>> }
  | { kind: "invalid"; value: unknown };

const PLURAL_CATEGORIES: ReadonlySet<string> = new Set<PluralCategory>([
  "zero",
  "one",
  "two",
  "few",
  "many",
  "other",
]);

/**
 * The same rule as the `IsPluralForms` type: every key is a plural category,
 * `other` is present and every value is a string.
 */
function classify(value: unknown): DictionaryNode {
  if (typeof value === "string") return { kind: "string", value };

  if (typeof value !== "object" || value === null) return { kind: "invalid", value };

  const entries = Object.entries(value);
  const isPlural =
    entries.some(([key]) => key === "other") &&
    entries.every(([key, child]) => PLURAL_CATEGORIES.has(key) && typeof child === "string");

  if (isPlural) return { kind: "plural", forms: Object.fromEntries(entries) };

  return { kind: "section", children: Object.fromEntries(entries) };
}

function describe(node: DictionaryNode): string {
  if (node.kind === "invalid") return node.value === null ? "null" : `a ${typeof node.value}`;

  return { string: "a string", plural: "plural forms", section: "a section" }[node.kind];
}

const join = (path: string, key: string) => (path === "" ? key : `${path}.${key}`);

const pluralCategoriesCache = new Map<string, ReadonlySet<string>>();

function getPluralCategories(intlLocale: string): ReadonlySet<string> {
  let categories = pluralCategoriesCache.get(intlLocale);

  if (categories === undefined) {
    categories = new Set(new Intl.PluralRules(intlLocale).resolvedOptions().pluralCategories);
    pluralCategoriesCache.set(intlLocale, categories);
  }

  return categories;
}

/**
 * Compares every dictionary with the reference and lists what is wrong:
 * missing and extra keys, mismatched node types, empty strings, missing and
 * extra placeholders, plural forms the language needs or never uses
 * (the forms of a language come from `Intl.PluralRules`).
 *
 * Meant for a test (`expect(checkDictionaries(...)).toEqual([])`) or for
 * dictionaries that come from a server, where types cannot help.
 * Returns an empty list when everything is in order.
 */
export function checkDictionaries<M extends Readonly<Record<string, unknown>>>(
  options: CheckDictionariesOptions<M>,
): DictionaryIssue[] {
  const { dictionaries, reference } = options;
  const intlLocales: Partial<Record<string, string>> = options.intlLocales ?? {};
  const issues: DictionaryIssue[] = [];
  const referenceRoot = dictionaries[reference];

  for (const [locale, dictionary] of Object.entries<unknown>(dictionaries)) {
    const categories = getPluralCategories(intlLocales[locale] ?? locale);
    const report = (path: string, kind: DictionaryIssueKind, message: string) =>
      issues.push({ locale, path, kind, message });

    const checkPlaceholders = (
      path: string,
      text: string,
      required: ReadonlySet<string>,
      allowed: ReadonlySet<string>,
    ) => {
      const found = parsePlaceholders(text);

      for (const name of required) {
        if (!found.has(name)) report(path, "missing-placeholder", `{:${name}} is missing`);
      }

      for (const name of found) {
        if (!allowed.has(name)) {
          report(path, "extra-placeholder", `{:${name}} is not in the reference`);
        }
      }
    };

    const checkPluralForms = (path: string, forms: Readonly<Record<string, string>>) => {
      for (const category of categories) {
        if (!(category in forms)) {
          report(
            join(path, category),
            "missing-plural-form",
            `"${locale}" needs the "${category}" form`,
          );
        }
      }

      for (const category of Object.keys(forms)) {
        if (!categories.has(category)) {
          report(
            join(path, category),
            "unused-plural-form",
            `"${locale}" never uses the "${category}" form`,
          );
        }
      }
    };

    const walk = (value: unknown, referenceValue: unknown, path: string) => {
      const node = classify(value);
      const referenceNode = classify(referenceValue);

      if (node.kind === "invalid") {
        report(
          path,
          "wrong-type",
          `expected a string, plural forms or a section, got ${describe(node)}`,
        );
        return;
      }

      if (locale !== reference && node.kind !== referenceNode.kind) {
        report(path, "wrong-type", `expected ${describe(referenceNode)}, got ${describe(node)}`);
        return;
      }

      switch (node.kind) {
        case "string": {
          if (node.value.trim() === "") report(path, "empty", "the string is empty");

          if (referenceNode.kind === "string" && locale !== reference) {
            const referencePlaceholders = parsePlaceholders(referenceNode.value);
            checkPlaceholders(path, node.value, referencePlaceholders, referencePlaceholders);
          }
          return;
        }

        case "plural": {
          checkPluralForms(path, node.forms);

          const allowed = new Set<string>(["count"]);

          if (referenceNode.kind === "plural") {
            for (const form of Object.values(referenceNode.forms)) {
              for (const name of parsePlaceholders(form)) allowed.add(name);
            }
          }

          const required = new Set(allowed);
          required.delete("count");

          for (const [category, form] of Object.entries(node.forms)) {
            const formPath = join(path, category);

            if (form.trim() === "") report(formPath, "empty", "the string is empty");

            if (locale !== reference) checkPlaceholders(formPath, form, required, allowed);
          }
          return;
        }

        case "section": {
          const referenceChildren = referenceNode.kind === "section" ? referenceNode.children : {};

          for (const [key, child] of Object.entries(node.children)) {
            if (locale !== reference && !(key in referenceChildren)) {
              report(join(path, key), "extra-key", "the reference has no such key");
              continue;
            }

            walk(child, referenceChildren[key], join(path, key));
          }

          if (locale !== reference) {
            for (const key of Object.keys(referenceChildren)) {
              if (!(key in node.children)) {
                report(join(path, key), "missing-key", "the key is missing");
              }
            }
          }
          return;
        }
      }
    };

    walk(dictionary, referenceRoot, "");
  }

  return issues;
}
