import { describe, expect, it } from "vitest";

import * as core from "../index";
import * as react from "../react";

describe("entry points", () => {
  it("load", () => {
    expect(core).toBeTypeOf("object");
    expect(react).toBeTypeOf("object");
  });
});
