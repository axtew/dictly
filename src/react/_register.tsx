import type { ReactElement } from "react";

import type { I18n } from "../core";
import {
  type AnyI18n,
  createBindings,
  createI18nContext,
  Gate,
  type I18nProviderProps,
} from "./_bindings";

/**
 * Registers the app's i18n instance for the hooks exported from `dictly/react`,
 * the way i18next and TanStack Router do it:
 *
 * ```ts
 * declare module "dictly/react" {
 *   interface Register {
 *     i18n: typeof i18n;
 *   }
 * }
 * ```
 *
 * Without it the hooks know nothing about the dictionary; `createI18nReact`
 * is the alternative that needs no declaration.
 */
// oxlint-disable-next-line typescript/no-empty-interface, typescript/no-empty-object-type
export interface Register {}

export type RegisteredI18n = Register extends { i18n: infer I extends AnyI18n }
  ? I
  : I18n<unknown, string>;

const context = createI18nContext<RegisteredI18n>();

const bindings = createBindings(context);

export const { useT, useLocale, useFormatters, useI18n } = bindings;

/** Provides the registered instance to the hooks and waits for the first dictionary. */
export function I18nProvider({
  i18n,
  ...props
}: I18nProviderProps & { i18n: RegisteredI18n }): ReactElement {
  return (
    <context.Provider value={i18n}>
      <Gate i18n={i18n} {...props} />
    </context.Provider>
  );
}
