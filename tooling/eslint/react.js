/** @type {import('eslint').Linter.Config} */
const config = {
  extends: [
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
  ],
  rules: {
    "react/prop-types": "off",
    "react/jsx-curly-brace-presence": [
      "error",
      { props: "never", children: "never" },
    ],
    "jsx-a11y/no-autofocus": "off",
    "react-compiler/react-compiler": "error",
  },
  globals: {
    React: "writable",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  env: {
    browser: true,
  },
  plugins: ["eslint-plugin-react-compiler"],
};

module.exports = config;
