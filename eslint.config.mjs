import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';
import fsd from './scripts/fsd-plugin.mjs';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettier,
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    plugins: { fsd },
    rules: {
      'fsd/import-boundaries': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/**/ui/**/*.tsx', 'src/shared/ui/**/*.tsx', 'app/**/*.tsx'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'API 호출은 api segment에서 작성하세요.' },
      ],
    },
  },
  globalIgnores(['.next/**', 'coverage/**', 'public/mockServiceWorker.js', 'next-env.d.ts']),
]);
