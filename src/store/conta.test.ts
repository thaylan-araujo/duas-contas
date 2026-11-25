// src/store/conta.test.ts
// Testes RED (TDD) das funções puras do contexto ativo (D-06).
// Cobrem (1) empresaIdDoContexto — resolve o contaAtiva em empresaId|null usado
// pelo loader — e (2) a migração do persist do Zustand (v0 → v1), que converte a
// forma antiga ('CASA' | 'EMPRESA') na nova discriminated-union.
//
// ⚠️ Estado RED esperado: `empresaIdDoContexto` e `migrateContaStore` AINDA NÃO
// EXISTEM em `@/store/conta` (o Plano 04-02/04-03 vai adicioná-los). Este arquivo
// DEVE falhar ao rodar — a falha é o critério de sucesso do Plano 04-01.
import { describe, it, expect } from 'vitest'
import { empresaIdDoContexto, migrateContaStore } from '@/store/conta'

describe('empresaIdDoContexto (D-06 — contexto ativo → empresaId|null)', () => {
  it('Casa → null', () => {
    expect(empresaIdDoContexto({ tipo: 'CASA' })).toBeNull()
  })

  it('Empresa → o empresaId', () => {
    expect(
      empresaIdDoContexto({ tipo: 'EMPRESA', empresaId: 'abc' })
    ).toBe('abc')
  })
})

describe('migrateContaStore (D-06 — persist v0 → v1)', () => {
  it("v0 contaAtiva 'EMPRESA' → { tipo: 'CASA' } (empresa antiga cai p/ Casa)", () => {
    const migrado = migrateContaStore({ contaAtiva: 'EMPRESA' }, 0)
    expect(migrado.contaAtiva).toEqual({ tipo: 'CASA' })
  })

  it("v0 contaAtiva 'CASA' → { tipo: 'CASA' }", () => {
    const migrado = migrateContaStore({ contaAtiva: 'CASA' }, 0)
    expect(migrado.contaAtiva).toEqual({ tipo: 'CASA' })
  })

  it('preserva mesSelecionado ao migrar de v0', () => {
    const migrado = migrateContaStore(
      { contaAtiva: 'CASA', mesSelecionado: '2026-03' },
      0
    )
    expect(migrado.mesSelecionado).toBe('2026-03')
  })

  it('forma nova (v1) { tipo:"EMPRESA", empresaId } permanece intacta', () => {
    const atual = { contaAtiva: { tipo: 'EMPRESA', empresaId: 'xyz' } }
    const migrado = migrateContaStore(atual, 1)
    expect(migrado.contaAtiva).toEqual({ tipo: 'EMPRESA', empresaId: 'xyz' })
  })
})
