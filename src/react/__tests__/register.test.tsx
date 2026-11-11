// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createI18n } from "../..";
import en from "../../core/__tests__/fixtures/en";
import ru from "../../core/__tests__/fixtures/ru";
import { I18nProvider, useLocale, useT } from "..";
import type { registeredI18n } from "./_registered";

function Title() {
  const title = useT((l) => l.title);
  const { locale } = useLocale();

  return (
    <h1>
      {title} ({locale})
    </h1>
  );
}

afterEach(() => {
  cleanup();
});

describe("hooks exported from dictly/react (Register)", () => {
  it("read the instance given to I18nProvider", async () => {
    const i18n: typeof registeredI18n = createI18n({
      locales: { en: () => Promise.resolve(en), ru: () => Promise.resolve(ru) },
      defaultLocale: "en",
      initialLocale: "ru",
      storage: null,
    });

    render(
      <I18nProvider i18n={i18n} fallback={<p>Loading</p>}>
        <Title />
      </I18nProvider>,
    );

    await act(() => i18n.ready);

    expect(screen.getByRole("heading").textContent).toBe("Рецепты (ru)");
  });
});
