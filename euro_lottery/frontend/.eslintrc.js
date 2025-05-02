module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
    node: true, // Добавляем node окружение для распознавания process
  },
  globals: {
    process: 'readonly', // Явно указываем, что process - глобальная переменная только для чтения
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', 'jsx-a11y'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off', // Изменено с 'warn' на 'off' для отключения проверки
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'jsx-a11y/anchor-is-valid': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'build/**/*',
    'node_modules/**/*',
    'public/**/*',
    '*.test.js',
    '*.test.jsx',
  ],
};