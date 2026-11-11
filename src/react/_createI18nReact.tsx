import type { ReactElement } from "react";

import {
  type AnyI18n,
  createBindings,
  createI18nContext,
  Gate,
  type I18nBindings,
  type I18nProviderProps,
} from "./_bindings";

export interface I18nReact<I extends AnyI18n> extends I18nBindings<I> {
  /** Provides the instance to the hooks and waits for the first dictionary. */
  I18nProvider: (props: I18nProviderProps) => ReactElement;
}

/**
 * Hooks and a provider bound to one i18n instance, typed by it:
 *
 * ```ts
 * export const { I18nProvider, useT, useLocale, useFormatters } = createI18nReact(i18n);
 * ```
 *
 * Each call makes its own context, so two instances (an app and an embedded
 * widget, for example) never read each other's dictionary.
 */
export function createI18nReact<I extends AnyI18n>(i18n: I): I18nReact<I> {
  const context = createI18nContext<I>();

  function I18nProvider(props: I18nProviderProps): ReactElement {
    return (
      <context.Provider value={i18n}>
        <Gate i18n={i18n} {...props} />
      </context.Provider>
    );
  }

  return { I18nProvider, ...createBindings(context) };
}
