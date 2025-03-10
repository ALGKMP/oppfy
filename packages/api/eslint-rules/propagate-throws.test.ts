import * as test from "node:test";
import * as parser from "@typescript-eslint/parser";
import { RuleTester } from "@typescript-eslint/rule-tester";

import { rule } from "./propagate-throws.js";

// Set up the test framework functions as documented for Node.js test
RuleTester.afterAll = test.after;
RuleTester.describe = test.describe;
RuleTester.it = test.it;
RuleTester.itOnly = test.it.only;

// Create a RuleTester with the correct configuration
const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

// Run the tests with the correct rule name
ruleTester.run("uppercase-first-declarations", rule, {
  valid: [
    { code: "function HelloWorld() { return 'hello'; }" },
    { code: "function GetData() { return {}; }" },
    { code: "function UpdateUser(id) { console.log(id); }" },
    { code: "const arrowFunc = () => {};" },
    { code: "class MyClass { method() {} }" },
  ],
  invalid: [
    {
      code: "function helloWorld() { return 'hello'; }",
      errors: [{ messageId: "uppercase" }],
    },
    {
      code: "function getData() { return {}; }",
      errors: [{ messageId: "uppercase" }],
    },
    {
      code: "function updateUser(id) { console.log(id); }",
      errors: [{ messageId: "uppercase" }],
    },
    {
      code: "function mixedCase() { return true; }",
      errors: [{ messageId: "uppercase" }],
    },
  ],
});
