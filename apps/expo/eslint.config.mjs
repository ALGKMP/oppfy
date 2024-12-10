import baseConfig from "@oppfy/eslint-config/base";
import reactConfig from "@oppfy/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".expo/**", "expo-plugins/**"],
    plugins: ['eslint-plugin-react-compiler'],
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
  ...baseConfig,
  ...reactConfig,
];
