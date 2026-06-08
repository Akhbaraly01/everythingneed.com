import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Module-boundary enforcement: inside src/modules/<name>/**, you may NOT
  // import from a sibling module's internals. Cross-module access goes through
  // the public barrel `@modules/<other>` or via `@core/events` (EventBus).
  {
    files: ["src/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@modules/*/*", "@/modules/*/*"],
              message:
                "Module boundary violation: import from the module barrel '@modules/<name>' only, never reach into its internals.",
            },
            {
              group: ["@/integrations/supabase/*"],
              message:
                "Modules must not depend on infrastructure directly. Use '@core/api/client' instead.",
            },
          ],
        },
      ],
    },
  },
);
