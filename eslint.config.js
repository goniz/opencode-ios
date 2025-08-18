// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/api/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/array-type': 'off',
    },
  },
  {
    files: ['src/components/chat/**/*.tsx'],
    rules: {
      'import/no-unresolved': 'off', // Temporary fix for react-native packages
    },
  },
]);
