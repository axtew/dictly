import { createPlural, type PluralFormatter } from "./_plural";

/**
 * `Intl` formatting bound to one language. Formatter instances are cached per options.
 * Plain function properties, so `const { number, plural } = formatters` is safe.
 */
export interface Formatters {
  /** The `Intl` locale the formatters use ("en-GB" for "en", if so mapped). */
  readonly locale: string;
  number: (value: number | bigint, options?: Intl.NumberFormatOptions) => string;
  date: (value: Date | number, options?: Intl.DateTimeFormatOptions) => string;
  relativeTime: (
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    options?: Intl.RelativeTimeFormatOptions,
  ) => string;
  list: (items: Iterable<string>, options?: Intl.ListFormatOptions) => string;
  plural: PluralFormatter;
}

function cached<F, O>(create: (options: O | undefined) => F): (options: O | undefined) => F {
  const cache = new Map<string, F>();

  return (options) => {
    const key = options === undefined ? "" : JSON.stringify(options);
    let instance = cache.get(key);

    if (instance === undefined) {
      instance = create(options);
      cache.set(key, instance);
    }

    return instance;
  };
}

const formattersByLocale = new Map<string, Formatters>();

export function getFormatters(locale: string): Formatters {
  const existing = formattersByLocale.get(locale);

  if (existing !== undefined) return existing;

  const numberFormat = cached(
    (o: Intl.NumberFormatOptions | undefined) => new Intl.NumberFormat(locale, o),
  );
  const dateFormat = cached(
    (o: Intl.DateTimeFormatOptions | undefined) => new Intl.DateTimeFormat(locale, o),
  );
  const relativeTimeFormat = cached(
    (o: Intl.RelativeTimeFormatOptions | undefined) => new Intl.RelativeTimeFormat(locale, o),
  );
  const listFormat = cached(
    (o: Intl.ListFormatOptions | undefined) => new Intl.ListFormat(locale, o),
  );

  const formatters: Formatters = {
    locale,
    number: (value, options) => numberFormat(options).format(value),
    date: (value, options) => dateFormat(options).format(value),
    relativeTime: (value, unit, options) => relativeTimeFormat(options).format(value, unit),
    list: (items, options) => listFormat(options).format(items),
    plural: createPlural(locale),
  };

  formattersByLocale.set(locale, formatters);

  return formatters;
}
