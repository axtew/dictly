// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createI18n } from "../..";
import { deferred, setBrowserLanguages } from "../../core/__tests__/_helpers";
import en from "../../core/__tests__/fixtures/en";
import ru from "../../core/__tests__/fixtures/ru";
import { createI18nReact } from "..";

beforeEach(() => {
  setBrowserLanguages(["en"]);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setup(ruLoader: () => Promise<typeof ru> = () => Promise.resolve(ru)) {
  const i18n = createI18n({
    locales: { en: () => Promise.resolve(en), ru: ruLoader },
    defaultLocale: "en",
    storage: null,
    onError: () => undefined,
  });

  return { i18n, ...createI18nReact(i18n) };
}

describe("createI18nReact", () => {
  it("shows the fallback until the dictionary arrives, then the children", async () => {
    const { i18n, I18nProvider, useT } = setup();

    function Title() {
      return <h1>{useT((l) => l.title)}</h1>;
    }

    render(
      <I18nProvider fallback={<p>Loading</p>}>
        <Title />
      </I18nProvider>,
    );

    expect(screen.getByText("Loading")).toBeTruthy();

    await act(() => i18n.ready);

    expect(screen.getByRole("heading").textContent).toBe("Recipes");
  });

  it("updates the text on a language switch, keeping the old one while loading", async () => {
    const ruLoad = deferred<typeof ru>();
    const { i18n, I18nProvider, useT, useLocale } = setup(() => ruLoad.promise);
    await i18n.ready;

    function Title() {
      const title = useT((l) => l.title);
      const { pendingLocale } = useLocale();

      return (
        <h1>
          {title}
          {pendingLocale !== null && ` (${pendingLocale}...)`}
        </h1>
      );
    }

    render(
      <I18nProvider>
        <Title />
      </I18nProvider>,
    );

    let switching!: Promise<void>;
    act(() => {
      switching = i18n.setLocale("ru");
    });

    expect(screen.getByRole("heading").textContent).toBe("Recipes (ru...)");

    ruLoad.resolve(ru);
    await act(() => switching);

    expect(screen.getByRole("heading").textContent).toBe("Рецепты");
  });

  it("useLocale switches the language from a component", async () => {
    const { i18n, I18nProvider, useT, useLocale } = setup();
    await i18n.ready;

    function Switcher() {
      const { locale, locales, setLocale } = useLocale();
      const title = useT((l) => l.title);

      return (
        <>
          <h1>{title}</h1>
          {locales.map((item) => (
            <button key={item} disabled={item === locale} onClick={() => void setLocale(item)}>
              {item}
            </button>
          ))}
        </>
      );
    }

    render(
      <I18nProvider>
        <Switcher />
      </I18nProvider>,
    );

    await act(async () => {
      screen.getByRole("button", { name: "ru" }).click();
      await i18n.setLocale("ru");
    });

    expect(screen.getByRole("heading").textContent).toBe("Рецепты");
    expect(screen.getByRole("button", { name: "ru" }).hasAttribute("disabled")).toBe(true);
  });

  it("useT without a selector gives the whole dictionary", async () => {
    const { i18n, I18nProvider, useT } = setup();
    await i18n.ready;

    function Count() {
      const l = useT();

      return <p>{l.recipes.other}</p>;
    }

    render(
      <I18nProvider>
        <Count />
      </I18nProvider>,
    );

    expect(screen.getByText("{:count} recipes")).toBeTruthy();
  });

  it("useFormatters follows the language", async () => {
    const { i18n, I18nProvider, useT, useFormatters } = setup();
    await i18n.ready;

    function Count() {
      const recipes = useT((l) => l.recipes);
      const { plural, number } = useFormatters();

      return (
        <p>
          {plural(recipes, 5)}, {number(1234.5)}
        </p>
      );
    }

    render(
      <I18nProvider>
        <Count />
      </I18nProvider>,
    );

    expect(screen.getByRole("paragraph").textContent).toBe("5 recipes, 1,234.5");

    await act(() => i18n.setLocale("ru"));

    expect(screen.getByRole("paragraph").textContent).toBe("5 рецептов, 1 234,5");
  });

  it("shows the error fallback with a retry when nothing could be loaded", async () => {
    const enLoader = vi
      .fn<() => Promise<typeof en>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(en);
    const i18n = createI18n({
      locales: { en: enLoader },
      defaultLocale: "en",
      storage: null,
      onError: () => undefined,
    });
    const { I18nProvider, useT } = createI18nReact(i18n);

    function Title() {
      return <h1>{useT((l) => l.title)}</h1>;
    }

    render(
      <I18nProvider
        fallback={<p>Loading</p>}
        errorFallback={(retry) => <button onClick={retry}>Retry</button>}
      >
        <Title />
      </I18nProvider>,
    );

    await act(() => i18n.ready);

    await act(async () => {
      screen.getByRole("button", { name: "Retry" }).click();
      await vi.waitFor(() => expect(i18n.status).toBe("ready"));
    });

    expect(screen.getByRole("heading").textContent).toBe("Recipes");
  });

  it("throws when a hook is used outside its provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { useT } = setup();

    function Title() {
      return <h1>{useT((l) => l.title)}</h1>;
    }

    expect(() => render(<Title />)).toThrow(/outside I18nProvider/);
  });

  it("keeps two instances apart", async () => {
    const app = setup();
    const widgetI18n = createI18n({
      locales: { ru: () => Promise.resolve(ru) },
      defaultLocale: "ru",
      storage: null,
      htmlLang: false,
    });
    const widget = createI18nReact(widgetI18n);
    await Promise.all([app.i18n.ready, widgetI18n.ready]);

    function AppTitle() {
      return <h1>{app.useT((l) => l.title)}</h1>;
    }

    function WidgetTitle() {
      return <h2>{widget.useT((l) => l.title)}</h2>;
    }

    render(
      <app.I18nProvider>
        <AppTitle />
        <widget.I18nProvider>
          <WidgetTitle />
        </widget.I18nProvider>
      </app.I18nProvider>,
    );

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Recipes");
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Рецепты");
  });
});
