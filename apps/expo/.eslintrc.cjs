/** @type {import('eslint').Linter.Config} */
const config = {
  root: true,
  extends: ["@acme/eslint-config/base", "@acme/eslint-config/react"],
  rules: {
    /* 
        Existing rules
    */
    "react/jsx-curly-brace-presence": [
      "error",
      { props: "never", children: "never" },
    ],
  },
};

module.exports = config;
