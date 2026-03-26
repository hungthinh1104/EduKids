const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'eslint.config.js',
      'src/modules/analytics/**',
      'src/modules/recommendation/**',
      'src/modules/report/**',
      'src/modules/media/**',
      'src/modules/pronunciation/**',
    ],
  },
  {
    files: ['**/*.ts', '!**/*.spec.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "tsconfig.eslint.json",
        sourceType: 'module',
      },
      globals: {
        node: 'readonly',
        jest: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'prefer-const': 'warn',
      'prettier/prettier': 'warn',
      'no-useless-assignment': 'warn',
      'no-unused-vars': 'off',
      'preserve-caught-error': 'warn',
    },
  },
  {
    files: ['**/*.spec.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "tsconfig.eslint.json",
        sourceType: 'module',
      },
      globals: {
        node: 'readonly',
        jest: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-const': 'warn',
      'prettier/prettier': 'warn',
      'no-useless-assignment': 'warn',
      'no-unused-vars': 'off',
      'preserve-caught-error': 'warn',
    },
  },
  prettier,
];
