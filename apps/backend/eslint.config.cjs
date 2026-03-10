const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".eslintrc.js",
      "src/modules/analytics/**",
      "src/modules/recommendation/**",
      "src/modules/report/**",
      "src/modules/media/**",
      "src/modules/pronunciation/**",
    ],
  },
  ...compat.config({
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: "./tsconfig.eslint.json",
      sourceType: "module",
    },
    plugins: ["@typescript-eslint", "prettier"],
    extends: [
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended",
    ],
    env: {
      node: true,
      jest: true,
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "prefer-const": "warn",
      "prettier/prettier": "warn",
      "no-unused-vars": "off",
    },
  }),
];
