import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      $engine: fileURLToPath(new URL('./src/engine', import.meta.url)),
      $content: fileURLToPath(new URL('./src/content', import.meta.url)),
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      $i18n: fileURLToPath(new URL('./src/i18n', import.meta.url))
    }
  },
  test: {
    // Unit suite only: *.test.ts under tests/**. Playwright e2e specs live in tests/e2e/**/*.spec.ts
    // and are explicitly excluded so `vitest run` never picks them up (they need a browser + server).
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'node'
  }
});
