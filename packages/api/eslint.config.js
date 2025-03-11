import baseConfig from "@oppfy/eslint-config/base";
// import { propagateThrowsRule } from "./eslint-rules/propagate-throws.js";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [],
    rules: {
      // Register the custom rule under a local key:
      // "propagate-throws": "error",
    },
  },
  ...baseConfig,
];
