import type { ReactElement } from "react";

import type { I18n } from "../core";
import {
  type AnyI18n,
  createBindings,
  createI18nContext,
  Gate,
  type I18nBindings,
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

type RegisteredBindings = I18nBindings<RegisteredI18n>;

const context = createI18nContext<RegisteredI18n>();

const bindings: RegisteredBindings = createBindings(context);

// Explicit types keep `RegisteredI18n` as a reference in the emitted .d.ts, so it is
// resolved against the app's `Register`. An inferred type would be expanded at build
// time, freezing whatever `Register` the library itself saw (`isolatedDeclarations`
// in tsconfig.build.json forbids that).
export const useT: RegisteredBindings["useT"] = bindings.useT;
export const useLocale: RegisteredBindings["useLocale"] = bindings.useLocale;
export const useFormatters: RegisteredBindings["useFormatters"] = bindings.useFormatters;
export const useI18n: RegisteredBindings["useI18n"] = bindings.useI18n;

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
