import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/__tests__/*.test.{ts,tsx}"],
    typecheck: {
      enabled: true,
      include: ["src/**/__tests__/*.test-d.{ts,tsx}"],
    },
  },
});
