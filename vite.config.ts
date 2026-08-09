import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/puzzle-picnic/' : '/',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
