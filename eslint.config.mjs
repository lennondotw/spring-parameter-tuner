import eslintJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import prettierPlugin from 'eslint-plugin-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import tsEslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

/** @type {string[]} */
const TS_FILES = ['**/*.{js,jsx,ts,tsx,mjs,cjs}'];

const tailwindCssStylesheetPath = new URL('./src/global.css', import.meta.url);

/**
 * @type {import('eslint').Linter.Config[]}
 */
const eslintConfig = [
  // Global ignores
  { ignores: ['node_modules', 'dist'] },
  { linterOptions: { reportUnusedDisableDirectives: true } },

  // TypeScript parser for all files
  {
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        projectService: true,
      },
    },
    files: TS_FILES,
  },

  // Base JS rules
  {
    rules: {
      ...eslintJs.configs.recommended.rules,
      'no-undef': 'off',
    },
    files: TS_FILES,
  },

  // TypeScript rules
  {
    plugins: {
      '@typescript-eslint': tsEslint.plugin,
    },
    rules: {
      ...tsEslint.configs.strictTypeChecked[2]?.rules,
      ...tsEslint.configs.stylisticTypeChecked[2]?.rules,
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-confusing-void-expression': 'off',
    },
    files: TS_FILES,
  },

  // React rules
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': /** @type { any } } */ (reactHooksPlugin),
      'react-refresh': reactRefreshPlugin,
      'better-tailwindcss': eslintPluginBetterTailwindcss,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .../** @type { Record<string, unknown> } */ (reactHooksPlugin.configs['recommended-latest'].rules),
      ...eslintPluginBetterTailwindcss.configs['recommended-warn'].rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'better-tailwindcss/no-unregistered-classes': 'off',
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
    },
    settings: {
      react: { version: 'detect' },
      'better-tailwindcss': {
        entryPoint: fileURLToPath(tailwindCssStylesheetPath),
      },
    },
    files: TS_FILES,
  },

  // Prettier (must be last to override conflicting rules)
  {
    rules: eslintConfigPrettier.rules,
    files: TS_FILES,
  },
  {
    plugins: { prettier: prettierPlugin },
    rules: { 'prettier/prettier': 'error' },
    files: TS_FILES,
  },
];

export default eslintConfig;
