// src/app/(authed)/visao-geral/_lib/contas-fixas-bloco.test.ts
// Funções puras do bloco "Contas fixas": montagem das linhas + matemática dos
// chips do hero (WARNING 4 — Variável gasto nunca negativo, reconcilia com o
// comprometido). Sem Prisma.
import { describe, it, expect } from 'vitest'
import {
  montarLinhasContasFixas,
  computeChipsContasFixas,
  type FixaConta,
  type FixaTransacao,
} from './contas-fixas-bloco'

const contas: FixaConta[] = [
  { id: 'fa-aluguel', name: 'Aluguel', dueDay: 5, amountCents: 150_000, isVariableAmount: false },
  { id: 'fa-luz', name: 'Luz', dueDay: 10, amountCents: 0, isVariableAmount: true },
  { id: 'fa-net', name: 'Internet', dueDay: 15, amountCents: 10_000, isVariableAmount: false },
]

describe('montarLinhasContasFixas', () => {
  it('casa cada fixa com sua Transaction; sem tx → linha não gerada (status null)', () => {
    const tx: FixaTransacao[] = [
      {
        id: 'tx-aluguel',
        fixedAccountId: 'fa-aluguel',
        status: 'EM_ABERTO',
        amountCents: 150_000,
        estimatedCents: null,
        dueDate: new Date(2026, 10, 5),
        isVariableAmount: false,
      },
    ]
    const linhas = montarLinhasContasFixas(contas, tx)
    const aluguel = linhas.find((l) => l.fixedAccountId === 'fa-aluguel')!
    const luz = linhas.find((l) => l.fixedAccountId === 'fa-luz')!
    expect(aluguel.transacaoId).toBe('tx-aluguel')
    expect(aluguel.status).toBe('EM_ABERTO')
    expect(luz.status).toBeNull() // não gerada
  })

  it('ordena em aberto primeiro (por vencimento), depois pagas, depois não geradas', () => {
    const tx: FixaTransacao[] = [
      { id: 't1', fixedAccountId: 'fa-aluguel', status: 'PAGO', amountCents: 150_000, estimatedCents: null, dueDate: new Date(2026, 10, 5), isVariableAmount: false },
      { id: 't2', fixedAccountId: 'fa-net', status: 'EM_ABERTO', amountCents: 10_000, estimatedCents: null, dueDate: new Date(2026, 10, 15), isVariableAmount: false },
    ]
    const ordem = montarLinhasContasFixas(contas, tx).map((l) => l.fixedAccountId)
    // em aberto (net) → paga (aluguel) → não gerada (luz)
    expect(ordem).toEqual(['fa-net', 'fa-aluguel', 'fa-luz'])
  })
})

describe('computeChipsContasFixas (WARNING 4)', () => {
  it('Já pago = totalSpentPago; Variável = max(0, total − fixasPagas)', () => {
    // fixas: aluguel PAGO 150000; luz a definir EM_ABERTO estimativa 18000.
    // totalSpentPago = 170000 (aluguel 150000 + uma avulsa paga de 20000).
    const tx: FixaTransacao[] = [
      { id: 't1', fixedAccountId: 'fa-aluguel', status: 'PAGO', amountCents: 150_000, estimatedCents: null, dueDate: null, isVariableAmount: false },
      { id: 't2', fixedAccountId: 'fa-luz', status: 'EM_ABERTO', amountCents: 0, estimatedCents: 18_000, dueDate: null, isVariableAmount: true },
    ]
    const chips = computeChipsContasFixas(170_000, tx)
    expect(chips.fixasPagasCents).toBe(150_000)
    // contas fixas = aluguel pago 150000 + luz em aberto estimativa 18000
    expect(chips.contasFixasCents).toBe(168_000)
    expect(chips.jaPagoCents).toBe(170_000)
    // variável = 170000 − 150000 = 20000 (a avulsa paga)
    expect(chips.variavelCents).toBe(20_000)
  })

  it('Variável NUNCA negativo mesmo com fixasPagas > totalSpentPago', () => {
    // Defensivo: se totalSpentPago < soma das fixas pagas (inconsistência), clamp 0.
    const tx: FixaTransacao[] = [
      { id: 't1', fixedAccountId: 'fa-aluguel', status: 'PAGO', amountCents: 150_000, estimatedCents: null, dueDate: null, isVariableAmount: false },
    ]
    const chips = computeChipsContasFixas(100_000, tx)
    expect(chips.variavelCents).toBe(0)
  })

  it('sem fixas → chips refletem só o gasto pago', () => {
    const chips = computeChipsContasFixas(50_000, [])
    expect(chips).toEqual({
      fixasPagasCents: 0,
      contasFixasCents: 0,
      jaPagoCents: 50_000,
      variavelCents: 50_000,
    })
  })
})
