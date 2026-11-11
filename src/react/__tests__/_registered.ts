import type { createI18n } from "../..";
import type en from "../../core/__tests__/fixtures/en";
import type ru from "../../core/__tests__/fixtures/ru";

/**
 * The instance type the tests register, the way an app does:
 * `declare module "dictly/react" { interface Register { i18n: typeof i18n } }`.
 */
export declare const registeredI18n: ReturnType<
  typeof createI18n<{ en: () => Promise<typeof en>; ru: () => Promise<typeof ru> }, "en">
>;

declare module ".." {
  interface Register {
    i18n: typeof registeredI18n;
  }
}
