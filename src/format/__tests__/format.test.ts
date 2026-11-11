import { describe, expect, it } from "vitest";

import { format } from "..";

describe("format", () => {
  it("returns a string without placeholders as is", () => {
    expect(format("Recipes")).toBe("Recipes");
  });

  it("puts parameters into placeholders", () => {
    expect(format("{:count} of {:total}", { count: 3, total: 10 })).toBe("3 of 10");
  });

  it("replaces every occurrence of a placeholder", () => {
    expect(format("{:n} from {:n}", { n: 3 })).toBe("3 from 3");
  });

  it("inserts values literally, without replacement patterns", () => {
    expect(format("a {:x} b", { x: "$&" })).toBe("a $& b");
    expect(format("a {:x} b", { x: "$1 $` $'" })).toBe("a $1 $` $' b");
  });

  it("does not resolve a placeholder that appears in a value", () => {
    expect(format("{:a} {:b}", { a: "{:b}", b: "B" })).toBe("{:b} B");
  });

  it("keeps a placeholder without a value visible", () => {
    const untyped: string = "{:count} of {:total}";

    expect(format(untyped, { count: 3 })).toBe("3 of {:total}");
    expect(format(untyped)).toBe("{:count} of {:total}");
  });

  it("ignores inherited keys of the params object", () => {
    const untyped: string = "{:toString}";

    expect(format(untyped, {})).toBe("{:toString}");
  });

  it("handles adjacent placeholders and an empty value", () => {
    expect(format("{:a}{:b}", { a: "x", b: "" })).toBe("x");
  });
});
