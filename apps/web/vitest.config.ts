import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitest/config';

const modulePath = (name: string) =>
  fileURLToPath(new URL(`../../node_modules/${name}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {find: 'react-router-dom', replacement: modulePath('react-router-dom/dist/index.mjs')},
      {find: /^react-router\/dom$/, replacement: modulePath('react-router/dist/development/dom-export.mjs')},
      {find: 'react-router', replacement: modulePath('react-router/dist/development/index.mjs')},
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.tsx'],
    pool: 'vmForks',
  },
});