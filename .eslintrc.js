const path = require('path')

module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    project: path.resolve(__dirname, './tsconfig.json'),
    tsconfigRootDir: __dirname,
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    createDefaultProgram: true
  },
  rules: {
    'space-before-function-paren': 0,
    'import/export': 0,
    indent: ['error', 2],
    'no-unused-vars': 'error',
    'no-console': 'off'
  }
}
