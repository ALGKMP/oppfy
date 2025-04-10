import baseConfig from "@oppfy/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  ...baseConfig,
  {
    ignores: [],
    rules: {
      ...baseConfig.rules,
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
];
