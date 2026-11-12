# dictly

[![CI](https://github.com/axtew/dictly/actions/workflows/ci.yml/badge.svg)](https://github.com/axtew/dictly/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dictly)](https://www.npmjs.com/package/dictly)
[![license](https://img.shields.io/npm/l/dictly)](./LICENSE)

Typed i18n for TypeScript and React. The dictionary is a plain object, a translation is property access, and placeholder names are typed from the strings themselves.

[Live demo](https://dictly.stevvy1122.workers.dev) · [Русская версия](./README.ru.md)

```tsx
// en.ts
export default {
  greeting: "Hello, {:name}!",
  recipes: { one: "{:count} recipe", other: "{:count} recipes" },
} as const;

// Profile.tsx
const l = useT();
const { plural } = useFormatters();

format(l.greeting, { name: user.name }); // "Hello, Anna!"
format(l.greeting, { nmae: user.name }); // type error: "name" is missing
plural(l.recipes, 5); // "5 recipes"
l.recipse; // type error: no such key
```

- **No keys as strings.** `l.profile.title` instead of `t("profile.title")`: autocomplete, go to definition and rename work, and a typo does not compile.
- **Typed placeholders without a generator.** The parameter names come from the string type, so there is no CLI, watcher or generated file to keep in sync.
- **Languages load on demand.** Each language is its own chunk (`import()`) or a JSON file from a server. While the next one loads, the current text stays on screen.
- **Plural forms from `Intl.PluralRules`.** English needs two forms, Russian four; the numbers are formatted for the language.
- **Elements inside text.** A sentence with a link stays one string in the dictionary.
- **Dictionary check.** Compares JSON dictionaries with the reference language: missing keys, lost placeholders, missing plural forms.
- **Small.** 2.7 kB min + gzip with the React bindings, see [Bundle size](#bundle-size).

## Contents

- [Install](#install)
- [Quick start](#quick-start)
- [Placeholders](#placeholders)
- [Plural forms](#plural-forms)
- [Elements inside text](#elements-inside-text)
- [Formatters](#formatters)
- [JSON dictionaries](#json-dictionaries)
- [Checking dictionaries](#checking-dictionaries)
- [Switching the language](#switching-the-language)
- [Hooks without the factory](#hooks-without-the-factory)
- [Outside React](#outside-react)
- [Bundle size](#bundle-size)
- [Limitations](#limitations)

## Install

```sh
pnpm add dictly
# or: npm install dictly
```

TypeScript 5.0 or newer. The React bindings (`dictly/react`) need React 18 or newer; the core works without React.

## Quick start

**1. Dictionaries.** The reference language is a TS module with `as const`. Its shape is the type of the dictionary everywhere in the code.

```ts
// src/i18n/en.ts
export default {
  title: "Recipes",
  greeting: "Hello, {:name}!",
  recipes: { one: "{:count} recipe", other: "{:count} recipes" },
  profile: { save: "Save", logout: "Log out" },
} as const;
```

Other languages are checked against it with `satisfies`: the same keys, and every placeholder of each string.

```ts
// src/i18n/ru.ts
import type { Translation } from "dictly";
import type en from "./en";

export default {
  title: "Рецепты",
  greeting: "Привет, {:name}!",
  recipes: {
    one: "{:count} рецепт",
    few: "{:count} рецепта",
    many: "{:count} рецептов",
    other: "{:count} рецепта",
  },
  profile: { save: "Сохранить", logout: "Выйти" },
} as const satisfies Translation<typeof en>;
```

**2. The instance and its hooks**, in one file of the app:

```ts
// src/i18n/index.ts
import { createI18n } from "dictly";
import { createI18nReact } from "dictly/react";

export const i18n = createI18n({
  locales: {
    en: () => import("./en"),
    ru: () => import("./ru"),
  },
  defaultLocale: "en",
});

export const { I18nProvider, useT, useLocale, useFormatters } = createI18nReact(i18n);
```

The keys of `locales` are the supported languages. Each loader returns the dictionary or a module with it as the default export, so `() => import("./en")` works as is, and each language becomes its own chunk.

**3. The provider.** It shows `fallback` until the first dictionary arrives.

```tsx
// src/main.tsx
createRoot(root).render(
  <I18nProvider fallback={<Spinner />}>
    <App />
  </I18nProvider>,
);
```

**4. Components.**

```tsx
import { format } from "dictly";
import { useFormatters, useT } from "./i18n";

function RecipesHeader({ count, name }: { count: number; name: string }) {
  const l = useT();
  const { plural } = useFormatters();

  return (
    <header>
      <h1>{l.title}</h1>
      <p>{format(l.greeting, { name })}</p>
      <p>{plural(l.recipes, count)}</p>
    </header>
  );
}
```

`useT((l) => l.profile)` returns one section, which keeps the lines short in a component that only needs it.

## Placeholders

A placeholder is `{:name}`. `format` takes exactly the parameters the string has:

```ts
format(l.greeting, { name: "Anna" }); // "Hello, Anna!"
format(l.greeting); // type error: "name" is missing
format(l.greeting, { name: "Anna", age: 30 }); // type error: "age" is not in the string
format(l.title); // a string without placeholders takes no parameters
```

Values are strings or numbers. Format a date or a price before passing it, with [Formatters](#formatters) or any other function:

```ts
format(l.total, { sum: number(1499.5, { style: "currency", currency: "EUR" }) });
```

Every occurrence of a placeholder is replaced, and a value is inserted as is (`$&` in a value stays `$&`). A placeholder without a value stays visible as `{:name}`: a broken spot on screen is easier to notice than an empty one.

Nested sections and arrays work as you would expect: `l.profile.save`, `l.steps[0]`.

## Plural forms

An object whose keys are all plural categories (`zero`, `one`, `two`, `few`, `many`, `other`) and which has `other` is a set of forms:

```ts
recipes: { one: "{:count} recipe", other: "{:count} recipes" },
```

`plural` picks the form with `Intl.PluralRules` of the language on screen and fills `{:count}` with the number formatted for that language ("1,234" in English, "1 234" in Russian). Other placeholders are passed as the third argument:

```ts
const { plural } = useFormatters();

plural(l.recipes, 5); // "5 recipes"
plural(l.recipesBy, 3, { author: "Anna" }); // "3 recipes by Anna"
```

Each language has its own set of forms: Russian needs `one`, `few`, `many` and `other`, English only `one` and `other`. `Translation<typeof en>` requires `other` and allows the rest; [the check](#checking-dictionaries) tells which forms a language misses. A form the dictionary lacks falls back to `other`.

The singular form may omit `{:count}`: `{ one: "a recipe", other: "{:count} recipes" }`.

## Elements inside text

`format` from `dictly/react` also takes React elements, so a sentence with a link or bold text stays one string, and translators see it whole:

```tsx
import { format } from "dictly/react";

// terms: "By signing up you accept the {:link}.", termsLink: "terms of use"
<p>{format(l.terms, { link: <a href="/terms">{l.termsLink}</a> })}</p>;
```

With strings and numbers only it returns a string; once an element is among the values, it returns a `ReactNode`, and the type says so. The same element can be used twice, without key warnings.

## Formatters

`useFormatters()` returns `Intl` formatters for the language on screen. Instances are cached, so calling them during render is cheap.

```ts
const { number, date, relativeTime, list, plural } = useFormatters();

number(1234567.891); // "1,234,567.891"
number(0.256, { style: "percent" }); // "26%"
date(new Date(), { dateStyle: "long" }); // "November 12, 2026"
relativeTime(-1, "day", { numeric: "auto" }); // "yesterday"
list(["flour", "sugar", "eggs"]); // "flour, sugar, and eggs"
```

The options are those of `Intl.NumberFormat`, `Intl.DateTimeFormat` and the others. When the language key is not the `Intl` locale you want, map it:

```ts
createI18n({ locales, defaultLocale: "en", intlLocales: { en: "en-GB" } });
```

## JSON dictionaries

Dictionaries can also come from a server or from `public/`. The loader returns the parsed JSON:

```ts
async function fetchDictionary<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return (await response.json()) as T;
}

createI18n({
  locales: {
    en: () => import("./en"), // the reference stays a TS module
    de: () => fetchDictionary<Translation<typeof en>>("/dictionaries/de.json"),
  },
  defaultLocale: "en",
});
```

If the reference language is JSON as well, describe its shape with an interface, and placeholders stay typed:

```ts
import type { Plural, Template } from "dictly";

interface Messages {
  title: string;
  greeting: Template<"name">;
  recipes: Plural<"count">;
}

createI18n({
  locales: {
    en: () => fetchDictionary<Messages>("/dictionaries/en.json"),
    ru: () => fetchDictionary<Messages>("/dictionaries/ru.json"),
  },
  defaultLocale: "en",
});
```

With a plain `Record<string, ...>` or `any`, everything still works, but the parameters of `format` become optional and unchecked. JSON has no types at runtime, so check such dictionaries as described below.

## Checking dictionaries

TypeScript checks dictionaries written as TS modules. For JSON, `checkDictionaries` compares every language with the reference:

```ts
// dictionaries.test.ts
import { checkDictionaries } from "dictly/check";
import en from "../public/dictionaries/en.json";
import ru from "../public/dictionaries/ru.json";

test("dictionaries match the reference", () => {
  expect(checkDictionaries({ dictionaries: { en, ru }, reference: "en" })).toEqual([]);
});
```

Each problem is `{ locale, path, kind, message }`, where `kind` is one of:

| kind                  | example                                                        |
| --------------------- | -------------------------------------------------------------- |
| `missing-key`         | `actions.delete` is in the reference, not in the translation   |
| `extra-key`           | the translation has a key the reference does not               |
| `wrong-type`          | a string in one, a section in the other                        |
| `empty`               | an empty string                                                |
| `missing-placeholder` | the reference has `{:name}`, the translation does not          |
| `extra-placeholder`   | the translation has `{:nmae}`, the reference does not          |
| `missing-plural-form` | Russian lacks `few`                                            |
| `unused-plural-form`  | English has `few`, which `Intl.PluralRules` never picks for it |

The same check can run in the app: with `validate`, every loaded dictionary is compared with the reference language (loaded for it if needed).

```ts
createI18n({ locales, defaultLocale: "en", validate: import.meta.env.DEV });
```

`true` reports to `console.warn`, a function receives the problems: `validate: (issues, locale) => sendToMonitoring(issues)`. The check lives in `dictly/check` and is loaded with `import()` only when `validate` is on, so an app without it does not ship it.

## Switching the language

```tsx
function LanguageSwitcher() {
  const { locale, locales, pendingLocale, setLocale } = useLocale();

  return locales.map((code) => (
    <button
      key={code}
      aria-pressed={code === locale}
      aria-busy={code === pendingLocale}
      onClick={() => void setLocale(code)}
    >
      {code}
    </button>
  ));
}
```

- The current dictionary stays on screen until the next one arrives; `pendingLocale` is the language being loaded. A language loaded once switches at once.
- Fast clicks are safe: only the latest choice wins, an older request finishing later is ignored.
- If a language fails to load, the screen keeps the previous one, the error goes to `error` in `useLocale()` and to `onError`, and calling `setLocale` again retries.
- `preload(locale)` on the instance loads a language in the background, on hover over the switcher for example.

The provider covers the first load:

```tsx
<I18nProvider
  fallback={<Spinner />}
  errorFallback={(retry) => <button onClick={retry}>Try again</button>}
>
```

`errorFallback` is shown only when no dictionary could be loaded at all; it can be a node or a function that gets `retry`.

**Which language comes first:** `initialLocale` if given (a language from a user profile, for example), then the stored choice, then the browser languages (`navigator.languages`, the whole list: `ru-RU` matches `ru`), then `defaultLocale`. If that language fails, dictly falls back to `defaultLocale`.

| Option        | Default                                |                                                                                                                         |
| ------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `storage`     | `localStorageAdapter("dictly.locale")` | where the explicit choice is kept. `cookieAdapter("locale")` when the server should know it too, `null` to keep nothing |
| `detect`      | `true`                                 | pick a language from `navigator.languages` when nothing is stored                                                       |
| `htmlLang`    | `true`                                 | set `<html lang>` to the language on screen                                                                             |
| `onError`     | `console.error`                        | called when a dictionary fails to load                                                                                  |
| `intlLocales` | the language keys                      | `Intl` locale per language                                                                                              |
| `validate`    | `false`                                | check every loaded dictionary                                                                                           |

## Hooks without the factory

If you prefer importing the hooks straight from the package, register the instance once, the way TanStack Router does it:

```ts
// src/i18n/index.ts
export const i18n = createI18n({ ... });

declare module "dictly/react" {
  interface Register {
    i18n: typeof i18n;
  }
}
```

```tsx
import { I18nProvider, useT } from "dictly/react";

<I18nProvider i18n={i18n}>...</I18nProvider>;
```

The factory needs no global declaration and lets two independent instances live in one app (an app and an embedded widget, for example), so it is the default in this README. Both give the same types.

## Outside React

The instance is a small store and does not depend on React:

```ts
const { dictionary, locale, status } = i18n.getSnapshot();
const unsubscribe = i18n.subscribe(() => render(i18n.getSnapshot()));

await i18n.ready; // the first dictionary is on screen (or failed)
i18n.plural(i18n.getSnapshot().dictionary!.recipes, 3);
```

`getFormatters(locale)`, `format`, `createPlural` and `matchLocale` are exported separately.

## Bundle size

The same small example in each library: a React component with a translated string with a parameter and a plural form. Minified with esbuild, React excluded, only what the first screen loads. Method and code: [`bench/size`](./bench/size), run with `pnpm bench:size`.

| Library                                           | min + gzip | Notes                                                                                |
| ------------------------------------------------- | ---------: | ------------------------------------------------------------------------------------ |
| rosetta                                           |     0.8 kB | no React bindings, no plural rules                                                   |
| typesafe-i18n                                     |     1.5 kB | types come from a code generator                                                     |
| @nanostores/i18n + nanostores + @nanostores/react |     2.2 kB | formatters are a separate import                                                     |
| **dictly**                                        | **2.7 kB** | React bindings, lazy loading, plural, `Intl` formatters, storage, language detection |
| Lingui (core + react)                             |     3.6 kB | needs a compile step (CLI or macro)                                                  |
| use-intl                                          |    11.7 kB | ICU message parser at runtime                                                        |
| react-intl                                        |    14.8 kB | ICU message parser at runtime                                                        |
| i18next + react-i18next                           |    17.7 kB |                                                                                      |

Measured in November 2026, the versions are in [`bench/size/package.json`](./bench/size/package.json).

## Limitations

- **Client-side.** dictly is built for client-rendered React apps (Vite, single-page apps). Server rendering is not a goal yet: the store detects the language in the browser, and there are no helpers for passing a dictionary from the server.
- **Plural forms are recognised by their keys.** A section whose keys are only plural categories and include `other` (`{ one: ..., other: ... }`) is treated as plural forms. Rename a key if a section really looks like that.
- **A module is recognised by its `default` key.** A loader result whose only key is `default` is taken for a module and unwrapped. A dictionary may have a `default` section next to other keys; a dictionary with nothing but a `default` section is not supported.
- **No ICU syntax.** Plural forms are separate strings, not `{count, plural, ...}` inside one; `select` and nested plurals are not supported. In return, nothing is parsed at runtime.

## License

[MIT](./LICENSE)
