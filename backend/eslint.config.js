import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
    {
        ignores: [
            'vendor/**',
            'node_modules/**',
            'public/**',
            'bootstrap/cache/**',
            'bootstrap/ssr/**',
            'storage/**',
            'playwright-report/**',
            'test-results/**',
            'e2e/.auth/**',
            'resources/js/**/*.d.ts',
            'resources/js/types/**',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['resources/js/**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.browser },
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs['recommended-latest'].rules,
            'react-refresh/only-export-components': [
                'warn',
                {
                    allowConstantExport: true,
                    // Hooks/config co-exported with their component modules —
                    // standard pattern (shadcn ThemeProvider/sonner, cart drawer).
                    allowExportNames: ['useTheme', 'useCartDrawer', 'useApp', 'toast', 'DEAL_LANDINGS', 'buttonClasses'],
                },
            ],
            // tsc already validates types - no-undef false-positives on TS.
            'no-undef': 'off',
            // Locked by Iteration 27: no `any` in UI code.
            '@typescript-eslint/no-explicit-any': 'error',
            // Spec 0: no BaaS runtime (Supabase / legacy generator) may re-enter
            // this system - Laravel + Inertia + PostgreSQL modular monolith only.
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@supabase/*', 'supabase', '**/*supabase*', '@lovable/*', '**/*lovable*'],
                            message:
                                'BaaS imports are forbidden. Canonical stack: Laravel 13 + Inertia + React + TypeScript + PostgreSQL.',
                        },
                    ],
                },
            ],
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },
    {
        files: ['*.{js,mjs,cjs}', '*.config.{js,ts}', 'vite.config.ts', 'scripts/**/*.mjs'],
        languageOptions: {
            globals: { ...globals.node },
        },
        rules: {
            // Tailwind/PostCSS configs are loaded via jiti in CJS style.
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
);
