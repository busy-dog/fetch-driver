import type { TSESLint } from "@typescript-eslint/utils";

import pluginVitest from "@vitest/eslint-plugin";
import importX from "eslint-plugin-import-x";
import pluginPlaywright from "eslint-plugin-playwright";
import pluginPrettier from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";

import type { Plugin } from "@eslint/config-helpers";

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfig(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
  },

  {
    name: "app/files-to-ignore",
    ignores: ["**/dist/**", "**/dist-ssr/**", "**/coverage/**"],
  },

  {
    ...pluginVitest.configs.recommended,
    files: ["src/**/__tests__/*"],
  },

  {
    ...pluginPlaywright.configs["flat/recommended"],
    files: ["e2e/**/*.{test,spec}.{js,ts,jsx,tsx}"],
  },

  {
    files: ["**/*.{ts,mts,tsx}"], // 应用到所有 TypeScript 文件
    plugins: {
      "import-x": importX as unknown as Plugin,
      prettier: pluginPrettier,
    },
    rules: {
      quotes: ["error", "double"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports", // 强制所有类型都要单独导入
          fixStyle: "separate-type-imports",
        },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import-x/no-duplicates": "error",
    },
  },
) as TSESLint.FlatConfig.Config[];
