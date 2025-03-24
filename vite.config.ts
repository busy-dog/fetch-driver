/// <reference types="vitest" />

import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'index.ts',
        'examples/*',
        'src/css.ts',
        'src/dom.ts',
        'src/error.ts',
        'src/model.ts',
        'src/types.ts',
        'coverage/**',
        'dist/**',
        '**/[.]**',
        'packages/*/test?(s)/**',
        '**/*.d.ts',
        '**/virtual:*',
        '**/__x00__*',
        '**/\x00*',
        'cypress/**',
        'test?(s)/**',
        'test?(-*).?(c|m)[jt]s?(x)',
        '**/*{.,-}{test,spec}.?(c|m)[jt]s?(x)',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/vitest.{workspace,projects}.[jt]s?(on)',
        '**/.{eslint,mocha,prettier}rc.{?(c|m)js,yml}',
      ]
    },
    testTimeout: 256000,
  },
  build: {
    target: ['es2016', 'chrome65'],
    lib: {
      entry: 'index.ts',
      fileName: 'index',
      name: '@busymango/fetch-driver',
    },
    rollupOptions: {
      external: ['mime', 'remeda'],
      output: {
        exports: 'named',
        name: '@busymango/fetch-driver'
      },
    },
  },
});
