import { vi } from "vitest";

import type { LocaleStorage } from "../_storage";

export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

/** A promise the test settles by hand: lets a test decide when a dictionary "arrives". */
export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

export function memoryStorage(
  initial: string | null = null,
): LocaleStorage & { value: string | null } {
  return {
    value: initial,
    get() {
      return this.value;
    },
    set(locale) {
      this.value = locale;
    },
  };
}

export function setBrowserLanguages(languages: string[]) {
  vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);
  vi.spyOn(navigator, "language", "get").mockReturnValue(languages[0] ?? "");
}
