import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Ambiente `node`: a lógica sob teste (src/lib/weeks.ts e demais funções de
// cálculo puras) é TypeScript puro — não precisa de DOM (03-VALIDATION.md).
// Alias `@` → src/ para espelhar o tsconfig: módulos de service importam
// `@/lib/prisma` no topo, mesmo quando só as funções puras são testadas.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
