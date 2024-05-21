import baseConfig, { restrictEnvAccess } from "@oppfy/eslint-config/base";
import nextjsConfig from "@oppfy/eslint-config/nextjs";
import reactConfig from "@oppfy/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
