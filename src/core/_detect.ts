function getBase(tag: string): string {
  return tag.toLowerCase().split("-")[0] ?? "";
}

/**
 * Picks the first supported language from the browser's preference list.
 * An exact tag wins ("pt-BR" for "pt-BR"), then the same base language
 * ("ru" for "ru-RU", "pt-BR" for "pt"). The whole list counts, not only the first entry.
 */
export function matchLocale<L extends string>(
  preferred: readonly string[],
  locales: readonly L[],
): L | undefined {
  for (const tag of preferred) {
    const lower = tag.toLowerCase();
    const exact = locales.find((locale) => locale.toLowerCase() === lower);

    if (exact !== undefined) return exact;

    const base = getBase(tag);
    const sameBase = locales.find((locale) => getBase(locale) === base);

    if (sameBase !== undefined) return sameBase;
  }

  return undefined;
}

export function getBrowserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];

  return navigator.languages?.length ? navigator.languages : [navigator.language];
}
