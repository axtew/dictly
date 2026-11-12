# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com), versions follow [semver](https://semver.org). While the version is 0.x, a minor release may change the API.

## 0.1.1 - 2026-11-12

- README: describing the dictionary shape with a separate interface and checking every language, the reference included, with `Translation<Messages>`.

## 0.1.0 - 2026-11-12

The first release.

- `createI18n`: languages loaded on demand (`import()` or JSON), a cache, protection against races of fast switching, a retry after a failed load, the choice kept in `localStorage` or a cookie, detection from `navigator.languages`, `<html lang>`.
- Dictionary types: placeholder names typed from the strings, `Translation<typeof en>` for other languages, `Template` and `Plural` for JSON dictionaries described by an interface.
- `format` with typed parameters; `plural` with `Intl.PluralRules` and the number formatted for the language; `Intl` formatters for numbers, dates, relative time and lists.
- `dictly/react`: `createI18nReact` (hooks typed by the instance) or `Register` with the hooks from the package; `I18nProvider` with `fallback` and `errorFallback`; `useT`, `useLocale`, `useFormatters`, `useI18n`; `format` that puts React elements into placeholders.
- `dictly/check`: `checkDictionaries` finds missing and extra keys, lost and extra placeholders, missing and unused plural forms; the `validate` option runs it on every loaded dictionary.
- TypeScript 5.0 or newer, React 18 or newer.
