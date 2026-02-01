import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    testTimeout: 5000, // 5 seconds per test - prevents infinite hangs
    hookTimeout: 10000, // 10 seconds for setup/teardown hooks
    teardownTimeout: 5000, // 5 seconds for cleanup
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
