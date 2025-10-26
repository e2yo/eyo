import globals from 'globals';
import pluginJs from '@eslint/js';

const keys = {
  ...globals.jest,
  ...globals.node
};

export default [
  {
    ignores: [
      '.*',
      'dist/**',
      'node_modules/**',
      '*.config.js'
    ]
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}']
  },
  {
    languageOptions: { globals: keys }
  },
  pluginJs.configs.recommended,
];