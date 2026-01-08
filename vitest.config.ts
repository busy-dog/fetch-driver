import { playwright } from "@vitest/browser-playwright";

import { fileURLToPath } from "node:url";

import type { UserConfig } from "vite";

import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig as UserConfig,
  defineConfig({
    test: {
      coverage: {
        include: ["src/**/*.ts"],
      },
      browser: {
        enabled: true,
        provider: playwright(),
        // 至少需要一个实例
        instances: [{ browser: "chromium" }],
      },
      include: ["specs/**/*.spec.ts"],
      exclude: [...configDefaults.exclude],
      root: fileURLToPath(new URL("./", import.meta.url)),
    },
  }),
);
