# dictly

[![CI](https://github.com/axtew/dictly/actions/workflows/ci.yml/badge.svg)](https://github.com/axtew/dictly/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/dictly)](https://www.npmjs.com/package/dictly)
[![license](https://img.shields.io/npm/l/dictly)](./LICENSE)

Типизированная i18n для TypeScript и React. Словарь - обычный объект, перевод - обращение к свойству, а имена параметров типизированы по самим строкам.

[Демо](https://dictly.stevvy1122.workers.dev) · [English version](./README.md)

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
format(l.greeting, { nmae: user.name }); // ошибка типов: нет "name"
plural(l.recipes, 5); // "5 recipes"
l.recipse; // ошибка типов: такого ключа нет
```

- **Ключи не строки.** `l.profile.title` вместо `t("profile.title")`: работают автодополнение, переход к определению и переименование, а опечатка не компилируется.
- **Типизированные параметры без генератора.** Имена параметров берутся из типа строки, поэтому нет CLI, watcher и сгенерированных файлов, которые надо держать в актуальном состоянии.
- **Языки грузятся по требованию.** Каждый язык - отдельный чанк (`import()`) или JSON с сервера. Пока грузится новый, на экране остаётся текущий текст.
- **Множественное число через `Intl.PluralRules`.** Английскому нужны две формы, русскому четыре; числа форматируются по правилам языка.
- **Элементы внутри текста.** Фраза со ссылкой остаётся в словаре одной строкой.
- **Проверка словарей.** Сравнивает JSON-словари с эталонным языком: пропущенные ключи, потерянные параметры, недостающие формы множественного числа.
- **Маленький размер.** 2.7 kB min + gzip вместе с React-обвязкой, см. [Размер](#размер).

## Содержание

- [Установка](#установка)
- [Быстрый старт](#быстрый-старт)
- [Параметры](#параметры)
- [Множественное число](#множественное-число)
- [Элементы внутри текста](#элементы-внутри-текста)
- [Форматирование](#форматирование)
- [JSON-словари](#json-словари)
- [Проверка словарей](#проверка-словарей)
- [Переключение языка](#переключение-языка)
- [Хуки без фабрики](#хуки-без-фабрики)
- [Без React](#без-react)
- [Размер](#размер)
- [Ограничения](#ограничения)

## Установка

```sh
pnpm add dictly
# или: npm install dictly
```

Нужен TypeScript 5.0 или новее. React-обвязке (`dictly/react`) нужен React 18 или новее; ядро работает и без React.

## Быстрый старт

**1. Словари.** Эталонный язык - TS-модуль с `as const`. Его форма становится типом словаря во всём коде.

```ts
// src/i18n/en.ts
export default {
  title: "Recipes",
  greeting: "Hello, {:name}!",
  recipes: { one: "{:count} recipe", other: "{:count} recipes" },
  profile: { save: "Save", logout: "Log out" },
} as const;
```

Остальные языки проверяются по нему через `satisfies`: те же ключи и все параметры в каждой строке.

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

**2. Экземпляр и хуки**, в одном файле приложения:

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

Ключи `locales` - поддерживаемые языки. Загрузчик возвращает словарь или модуль, где словарь - экспорт по умолчанию, поэтому `() => import("./en")` работает как есть, и каждый язык попадает в свой чанк.

**3. Провайдер.** Пока не пришёл первый словарь, показывает `fallback`.

```tsx
// src/main.tsx
createRoot(root).render(
  <I18nProvider fallback={<Spinner />}>
    <App />
  </I18nProvider>,
);
```

**4. Компоненты.**

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

`useT((l) => l.profile)` возвращает один раздел: строки короче, если компоненту нужен только он.

## Параметры

Параметр записывается как `{:name}`. `format` принимает ровно те параметры, что есть в строке:

```ts
format(l.greeting, { name: "Anna" }); // "Hello, Anna!"
format(l.greeting); // ошибка типов: нет "name"
format(l.greeting, { name: "Anna", age: 30 }); // ошибка типов: "age" нет в строке
format(l.title); // строка без параметров параметров не принимает
```

Значения - строки или числа. Дату или цену отформатируйте заранее, через [форматтеры](#форматирование) или любую свою функцию:

```ts
format(l.total, { sum: number(1499.5, { style: "currency", currency: "EUR" }) });
```

Заменяется каждое вхождение параметра, значение вставляется как есть (`$&` в значении так и останется `$&`). Параметр без значения остаётся видимым как `{:name}`: сломанное место на экране заметить проще, чем пустое.

Вложенные разделы и массивы работают как обычно: `l.profile.save`, `l.steps[0]`.

## Множественное число

Объект, все ключи которого - категории множественного числа (`zero`, `one`, `two`, `few`, `many`, `other`) и среди них есть `other`, считается набором форм:

```ts
recipes: { one: "{:count} recipe", other: "{:count} recipes" },
```

`plural` выбирает форму через `Intl.PluralRules` языка на экране и подставляет в `{:count}` число, отформатированное для этого языка ("1,234" в английском, "1 234" в русском). Остальные параметры передаются третьим аргументом:

```ts
const { plural } = useFormatters();

plural(l.recipes, 5); // "5 recipes"
plural(l.recipesBy, 3, { author: "Anna" }); // "3 recipes by Anna"
```

У каждого языка свой набор форм: русскому нужны `one`, `few`, `many` и `other`, английскому только `one` и `other`. `Translation<typeof en>` требует `other` и разрешает остальные; каких форм не хватает языку, скажет [проверка](#проверка-словарей). Если нужной формы в словаре нет, берётся `other`.

В форме единственного числа можно обойтись без `{:count}`: `{ one: "a recipe", other: "{:count} recipes" }`.

## Элементы внутри текста

`format` из `dictly/react` принимает и React-элементы, поэтому фраза со ссылкой или жирным текстом остаётся одной строкой, и переводчик видит её целиком:

```tsx
import { format } from "dictly/react";

// terms: "By signing up you accept the {:link}.", termsLink: "terms of use"
<p>{format(l.terms, { link: <a href="/terms">{l.termsLink}</a> })}</p>;
```

Если среди значений только строки и числа, возвращается строка; если есть элемент, возвращается `ReactNode`, и тип это отражает. Один и тот же элемент можно вставить дважды, предупреждений про ключи не будет.

## Форматирование

`useFormatters()` возвращает форматтеры `Intl` для языка на экране. Экземпляры кэшируются, так что вызывать их при рендере дёшево.

```ts
const { number, date, relativeTime, list, plural } = useFormatters();

number(1234567.891); // "1 234 567,891"
number(0.256, { style: "percent" }); // "26 %"
date(new Date(), { dateStyle: "long" }); // "12 ноября 2026 г."
relativeTime(-1, "day", { numeric: "auto" }); // "вчера"
list(["мука", "сахар", "яйца"]); // "мука, сахар и яйца"
```

Опции те же, что у `Intl.NumberFormat`, `Intl.DateTimeFormat` и остальных. Если ключ языка не совпадает с нужной локалью `Intl`, задайте соответствие:

```ts
createI18n({ locales, defaultLocale: "en", intlLocales: { en: "en-GB" } });
```

## JSON-словари

Словари могут приходить и с сервера или из `public/`. Загрузчик возвращает разобранный JSON:

```ts
async function fetchDictionary<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return (await response.json()) as T;
}

createI18n({
  locales: {
    en: () => import("./en"), // эталон остаётся TS-модулем
    de: () => fetchDictionary<Translation<typeof en>>("/dictionaries/de.json"),
  },
  defaultLocale: "en",
});
```

Если и эталонный язык в JSON, опишите его форму интерфейсом, и параметры останутся типизированными:

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

С обычным `Record<string, ...>` или `any` всё тоже работает, но параметры `format` становятся необязательными и не проверяются. Во время работы у JSON типов нет, поэтому такие словари стоит проверять, как описано ниже.

## Проверка словарей

Словари в виде TS-модулей проверяет TypeScript. Для JSON есть `checkDictionaries`: он сравнивает каждый язык с эталонным:

```ts
// dictionaries.test.ts
import { checkDictionaries } from "dictly/check";
import en from "../public/dictionaries/en.json";
import ru from "../public/dictionaries/ru.json";

test("dictionaries match the reference", () => {
  expect(checkDictionaries({ dictionaries: { en, ru }, reference: "en" })).toEqual([]);
});
```

Каждая проблема - объект `{ locale, path, kind, message }`, где `kind` один из:

| kind                  | пример                                                                               |
| --------------------- | ------------------------------------------------------------------------------------ |
| `missing-key`         | `actions.delete` есть в эталоне, но нет в переводе                                   |
| `extra-key`           | в переводе есть ключ, которого нет в эталоне                                         |
| `wrong-type`          | в одном словаре строка, в другом раздел                                              |
| `empty`               | пустая строка                                                                        |
| `missing-placeholder` | в эталоне есть `{:name}`, в переводе нет                                             |
| `extra-placeholder`   | в переводе есть `{:nmae}`, в эталоне нет                                             |
| `missing-plural-form` | в русском нет формы `few`                                                            |
| `unused-plural-form`  | в английском есть `few`, а `Intl.PluralRules` её для английского никогда не выбирает |

Та же проверка может работать в приложении: с `validate` каждый загруженный словарь сравнивается с эталонным языком (эталон при необходимости догружается).

```ts
createI18n({ locales, defaultLocale: "en", validate: import.meta.env.DEV });
```

`true` пишет в `console.warn`, функция получает список проблем: `validate: (issues, locale) => sendToMonitoring(issues)`. Проверка живёт в `dictly/check` и подгружается через `import()`, только когда `validate` включён, так что в приложение без него она не попадает.

## Переключение языка

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

- Текущий словарь остаётся на экране, пока не придёт новый; `pendingLocale` - язык, который сейчас грузится. Уже загруженный язык включается сразу.
- Быстрые клики безопасны: побеждает последний выбор, а более старый запрос, завершившийся позже, игнорируется.
- Если язык не загрузился, на экране остаётся прежний, ошибка попадает в `error` из `useLocale()` и в `onError`, а повторный `setLocale` пробует снова.
- `preload(locale)` у экземпляра грузит язык в фоне, например при наведении на переключатель.

Первую загрузку закрывает провайдер:

```tsx
<I18nProvider
  fallback={<Spinner />}
  errorFallback={(retry) => <button onClick={retry}>Попробовать снова</button>}
>
```

`errorFallback` показывается, только если не загрузился вообще ни один словарь; это может быть узел или функция, которая получает `retry`.

**С какого языка начать:** `initialLocale`, если задан (например, язык из профиля пользователя), затем сохранённый выбор, затем языки браузера (`navigator.languages`, весь список: `ru-RU` подходит к `ru`), затем `defaultLocale`. Если этот язык не загрузился, dictly переключается на `defaultLocale`.

| Опция         | По умолчанию                           |                                                                                                                 |
| ------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `storage`     | `localStorageAdapter("dictly.locale")` | где хранить явный выбор. `cookieAdapter("locale")`, если язык должен знать и сервер, `null` - ничего не хранить |
| `detect`      | `true`                                 | брать язык из `navigator.languages`, если ничего не сохранено                                                   |
| `htmlLang`    | `true`                                 | ставить `<html lang>` по языку на экране                                                                        |
| `onError`     | `console.error`                        | вызывается, когда словарь не загрузился                                                                         |
| `intlLocales` | ключи языков                           | локаль `Intl` для каждого языка                                                                                 |
| `validate`    | `false`                                | проверять каждый загруженный словарь                                                                            |

## Хуки без фабрики

Если удобнее импортировать хуки прямо из пакета, зарегистрируйте экземпляр один раз, как это делает TanStack Router:

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

Фабрике не нужно глобальное объявление, и с ней в одном приложении могут жить два независимых экземпляра (например, приложение и встроенный виджет), поэтому в этом README основной вариант - она. Типы оба способа дают одинаковые.

## Без React

Экземпляр - маленький стор, от React он не зависит:

```ts
const { dictionary, locale, status } = i18n.getSnapshot();
const unsubscribe = i18n.subscribe(() => render(i18n.getSnapshot()));

await i18n.ready; // первый словарь на экране (или не загрузился)
i18n.plural(i18n.getSnapshot().dictionary!.recipes, 3);
```

`getFormatters(locale)`, `format`, `createPlural` и `matchLocale` экспортируются отдельно.

## Размер

Один и тот же маленький пример в каждой библиотеке: React-компонент со строкой с параметром и формой множественного числа. Минификация esbuild, React не считается, только то, что грузит первый экран. Метод и код: [`bench/size`](./bench/size), запуск: `pnpm bench:size`.

| Библиотека                                        | min + gzip | Оговорки                                                                                 |
| ------------------------------------------------- | ---------: | ---------------------------------------------------------------------------------------- |
| rosetta                                           |     0.8 kB | нет React-обвязки и правил множественного числа                                          |
| typesafe-i18n                                     |     1.5 kB | типы даёт генератор кода                                                                 |
| @nanostores/i18n + nanostores + @nanostores/react |     2.2 kB | форматтеры подключаются отдельно                                                         |
| **dictly**                                        | **2.7 kB** | React-обвязка, ленивая загрузка, plural, форматтеры `Intl`, хранение и определение языка |
| Lingui (core + react)                             |     3.6 kB | нужен шаг компиляции (CLI или macro)                                                     |
| use-intl                                          |    11.7 kB | разбор ICU-сообщений в браузере                                                          |
| react-intl                                        |    14.8 kB | разбор ICU-сообщений в браузере                                                          |
| i18next + react-i18next                           |    17.7 kB |                                                                                          |

Замер в ноябре 2026, версии в [`bench/size/package.json`](./bench/size/package.json).

## Ограничения

- **Только клиент.** dictly сделан для React-приложений, которые рендерятся в браузере (Vite, SPA). Серверный рендеринг пока не цель: стор определяет язык в браузере, и помощников, чтобы передать словарь с сервера, нет.
- **Формы множественного числа узнаются по ключам.** Раздел, все ключи которого - категории множественного числа и среди них есть `other` (`{ one: ..., other: ... }`), считается набором форм. Если раздел действительно так выглядит, переименуйте ключ.
- **Модуль узнаётся по ключу `default`.** Результат загрузчика, у которого единственный ключ `default`, считается модулем и разворачивается. Раздел `default` рядом с другими ключами в словаре возможен; словарь, в котором нет ничего, кроме раздела `default`, не поддерживается.
- **Нет синтаксиса ICU.** Формы множественного числа - отдельные строки, а не `{count, plural, ...}` внутри одной; `select` и вложенные plural не поддерживаются. Зато во время работы ничего не разбирается.

## Лицензия

[MIT](./LICENSE)
