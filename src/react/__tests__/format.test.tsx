// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { format } from "..";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("format (React)", () => {
  it("returns a plain string when the values are strings and numbers", () => {
    expect(format("{:count} of {:total}", { count: 1, total: "2" })).toBe("1 of 2");
    expect(format("Recipes")).toBe("Recipes");
  });

  it("puts an element into the text", () => {
    const node = format("By signing up you accept the {:link}.", {
      link: <a href="/terms">terms of use</a>,
    });
    const { container } = render(<p>{node}</p>);

    expect(container.innerHTML).toBe(
      '<p>By signing up you accept the <a href="/terms">terms of use</a>.</p>',
    );
  });

  it("mixes elements, strings and numbers, an element twice, without key warnings", () => {
    const consoleError = vi.spyOn(console, "error");
    const node = format("{:b}{:name}{:b}, {:count} new", {
      b: <b>*</b>,
      name: "Anna",
      count: 3,
    });
    const { container } = render(<p>{node}</p>);

    expect(container.innerHTML).toBe("<p><b>*</b>Anna<b>*</b>, 3 new</p>");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("keeps a placeholder without a value visible", () => {
    const untyped: string = "{:link} and {:missing}";
    const { container } = render(<p>{format(untyped, { link: <i>x</i> })}</p>);

    expect(container.innerHTML).toBe("<p><i>x</i> and {:missing}</p>");
  });
});
