export {
  cookieAdapter,
  type CookieAdapterOptions,
  createI18n,
  type DictionaryLoader,
  type I18n,
  type I18nOptions,
  type I18nSnapshot,
  type I18nStatus,
  type LoadedDictionary,
  type LocaleStorage,
  localStorageAdapter,
  matchLocale,
} from "./core";
export {
  createPlural,
  format,
  type Formatters,
  type FormatValue,
  getFormatters,
  type PluralFormatter,
  selectPluralForm,
} from "./format";
export type {
  Dictionary,
  FormatArgs,
  Placeholders,
  Plural,
  PluralCategory,
  PluralForms,
  Template,
  Translation,
} from "./types";
