// import type { Config } from 'prettier';

export const config = {
  plugins: [
    '@typescript-eslint/parser',
    'prettier-plugin-tailwindcss',
    '@trivago/prettier-plugin-sort-imports',
  ],
  semi: true,
  singleQuote: false,
  doubleQuote: true,
  printWidth: 80,
  importOrder: [
    '^node:',
    '^vite$',
    '^@vitejs',
    '^vue($|[-/])',
    '^@vue\/',
    '^@tanstack\/',
    '<THIRD_PARTY_MODULES>',
    '^virtual:.+',
    '^@/(.*)$',
    '^[./](?!.*\\.css$)',
    '^[../](?!.*\\.css$)',
    '^core-js/es',
    '^.*\\.css$',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
