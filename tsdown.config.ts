import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "react/index": "src/react/index.ts",
    "check/index": "src/check/index.ts",
  },
  format: "esm",
  platform: "neutral",
  target: "es2022",
  // Library sources only, with isolatedDeclarations: see tsconfig.build.json.
  tsconfig: "tsconfig.build.json",
  dts: true,
  clean: true,
});
