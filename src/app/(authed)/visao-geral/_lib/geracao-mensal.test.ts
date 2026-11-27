// src/app/(authed)/visao-geral/_lib/geracao-mensal.test.ts
// Testes das funções PURAS da geração mensal (sem Prisma) — a decisão de
// idempotência (quais fixas faltam gerar) e a montagem do valor da linha gerada.
// RED → GREEN (TDD). Fatia 10-02, C2.
import { describe, it, expect } from 'vitest'
import { fixasFaltandoGerar, valorLinhaGerada } from './geracao-mensal'

describe('fixasFaltandoGerar (idempotência — quais fixas ainda não têm linha no mês)', () => {
  const contas = [
    { id: 'fa-aluguel' },
    { id: 'fa-luz' },
    { id: 'fa-internet' },
  ]

  it('nenhuma gerada ainda → devolve todas as contas', () => {
    const result = fixasFaltandoGerar(contas, [])
    expect(result.map((c) => c.id)).toEqual([
      'fa-aluguel',
      'fa-luz',
      'fa-internet',
    ])
  })

  it('metade já gerada → devolve só as faltantes', () => {
    const result = fixasFaltandoGerar(contas, ['fa-aluguel'])
    expect(result.map((c) => c.id)).toEqual(['fa-luz', 'fa-internet'])
  })

  it('todas já geradas → devolve [] (idempotente: rodar de novo gera nada)', () => {
    const result = fixasFaltandoGerar(contas, [
      'fa-aluguel',
      'fa-luz',
      'fa-internet',
    ])
    expect(result).toEqual([])
  })

  it('ids já gerados que não estão nas contas são ignorados (não quebra)', () => {
    const result = fixasFaltandoGerar(contas, ['fa-antiga', 'fa-aluguel'])
    expect(result.map((c) => c.id)).toEqual(['fa-luz', 'fa-internet'])
  })
})

describe('valorLinhaGerada (montagem amountCents/estimatedCents da linha gerada)', () => {
  it('conta de valor certo (não "a definir") → amountCents=valor, estimatedCents=null', () => {
    const r = valorLinhaGerada({
      amountCents: 150_000,
      isVariableAmount: false,
      estimativaCents: 0,
    })
    expect(r).toEqual({ amountCents: 150_000, estimatedCents: null })
  })

  it('conta "a definir" → amountCents=0 e estimatedCents=estimativa (R-5)', () => {
    const r = valorLinhaGerada({
      amountCents: 0,
      isVariableAmount: true,
      estimativaCents: 18_000,
    })
    expect(r).toEqual({ amountCents: 0, estimatedCents: 18_000 })
  })

  it('conta "a definir" sem histórico (estimativa 0) → amountCents=0, estimatedCents=0 (não infla)', () => {
    const r = valorLinhaGerada({
      amountCents: 0,
      isVariableAmount: true,
      estimativaCents: 0,
    })
    expect(r).toEqual({ amountCents: 0, estimatedCents: 0 })
  })
})
