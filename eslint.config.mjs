import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import css from "@eslint/css";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
  { ignores: ["**/dist/**", "**/node_modules/**"] },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // Flag unused variables and allow underscore prefix to intentionally ignore
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Apply TypeScript recommended rules before more specific overrides
  ...tseslint.configs.recommended,
  // Apply unused-exports checks only to source files within packages
  {
    files: ["packages/**/src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { import: importPlugin },
    rules: {
      // Flag unused exports (functions, constants, types) at module level,
      // but do not force files to export something
      "import/no-unused-modules": [
        "error",
        { unusedExports: true, missingExports: false },
      ],
    },
  },
  // Relax unused-exports checks in tests and snapshots
  {
    files: [
      "**/*.test.*",
      "**/__tests__/**/*",
      "**/tests/**/*",
      "**/__snapshots__/**/*",
    ],
    rules: {
      "import/no-unused-modules": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Declaration files shouldn't be checked for unused exports and vars
  {
    files: ["**/*.d.ts"],
    rules: {
      "import/no-unused-modules": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/gfm",
    extends: ["markdown/recommended"],
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
  },
]);
