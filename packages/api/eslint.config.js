import neverthrowPlugin from "@bufferings/eslint-plugin-neverthrow";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  neverthrowPlugin.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.config.*"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
