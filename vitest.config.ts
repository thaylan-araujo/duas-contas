import { defineConfig } from 'vitest/config'

// Ambiente `node`: a lógica sob teste (src/lib/weeks.ts e demais funções de
// cálculo puras) é TypeScript puro — não precisa de DOM (03-VALIDATION.md).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
