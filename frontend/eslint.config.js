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
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-empty": "off",
      "@typescript-eslint/no-unnecessary-type-constraint": "off",
    },
  },
  // Module-boundary enforcement: inside src/modules/<name>/**, you may NOT
  // import from a sibling module's internals OR a sibling module's barrel.
  // Cross-module access MUST go through `@core/events` (EventBus) or a
  // contract re-exported from `@shared/*`. Infrastructure is reachable
  // only via `@core/api/*` or `@core/services/*`.
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
                "Module boundary violation: never reach into another module's internals. Use '@core/events' for cross-module communication or expose a contract via '@shared/*'.",
            },
            {
              group: ["@modules/*", "@/modules/*"],
              message:
                "Direct sibling-module imports are forbidden. Communicate across modules via '@core/events' (EventBus) or shared contracts in '@shared/*'.",
            },
            {
              group: ["@/integrations/*"],
              message:
                "Modules must not depend on legacy integrations. Use '@core/api/laravelGateway' (db, auth, storage) or '@core/services' instead.",
            },
            {
              group: ["@supabase/supabase-js", "@/integrations/supabase/*", "**/supabase/**"],
              message:
                "BaaS SDKs are forbidden. This is a Laravel 13 + Inertia.js + React + TypeScript + PostgreSQL modular monolith. Use '@core/api/laravelGateway' (db, auth, storage) instead.",
            },
            {
              group: ["@core/services/*", "@/core/services/*"],
              message:
                "Modules must depend on @core/contracts interfaces, not concrete services. Use the DI container's resolve(TOKENS.X).",
            },
            {
              group: ["axios"],
              message: "Use `http` from '@core/api' instead of axios.",
            },
            {
              group: ["@/pages/*", "@/components/*"],
              message:
                "Modules must own their pages/components. Move the file into 'src/modules/<name>/{pages,components}/' and re-export it from the module barrel.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Use `http` from '@core/api' instead of bare fetch()." },
      ],
    },
  },
);
