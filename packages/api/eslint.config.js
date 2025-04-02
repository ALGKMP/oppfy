import neverthrowPlugin from "eslint-plugin-neverthrow";

import baseConfig from "@oppfy/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [],
  },
  ...baseConfig,
  {
    plugins: {
      neverthrow: neverthrowPlugin,
    },
    rules: {
      "neverthrow/must-use-result": "error",
    },
  },
];
