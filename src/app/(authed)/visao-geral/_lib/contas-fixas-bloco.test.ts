// src/app/(authed)/visao-geral/_lib/contas-fixas-bloco.test.ts
// Funções puras do bloco "Contas fixas" da Casa (UAT Fase 10): o bloco agora é
// CENTRADO EM TRANSAÇÃO (uma linha por lançamento da categoria "Contas fixas" do
// mês — gerado de uma fixa OU avulso) + matemática dos chips do hero (WARNING 4 —
// Variável gasto nunca negativo, reconcilia com o comprometido). Sem Prisma.
import { describe, it, expect } from 'vitest'
import {
  montarLinhasContasFixas,
  computeChipsContasFixas,
  type FixaTransacao,
} from './contas-fixas-bloco'

describe('montarLinhasContasFixas (centrado em transação)', () => {
  it('monta uma linha por lançamento, usando a descrição como rótulo', () => {
    const tx: FixaTransacao[] = [
      {
        id: 'tx-aluguel',
        descricao: 'Aluguel',
        status: 'EM_ABERTO',
        amountCents: 150_000,
        estimatedCents: null,
        dueDate: new Date(2026, 10, 5),
        isVariableAmount: false,
      },
    ]
    const linhas = montarLinhasContasFixas(tx)
    expect(linhas).toHaveLength(1)
    expect(linhas[0].transacaoId).toBe('tx-aluguel')
    expect(linhas[0].nome).toBe('Aluguel')
    expect(linhas[0].status).toBe('EM_ABERTO')
  })

  it('inclui um lançamento MANUAL (sem fixa vinculada) como linha', () => {
    // "Luz" digitada à mão na categoria Contas fixas: isVariableAmount false,
    // sem estimativa. Deve aparecer como uma linha normal do bloco.
    const tx: FixaTransacao[] = [
      {
        id: 'tx-luz-manual',
        descricao: 'Luz',
        status: 'EM_ABERTO',
        amountCents: 12_000,
        estimatedCents: null,
        dueDate: new Date(2026, 10, 10),
        isVariableAmount: false,
      },
    ]
    const linhas = montarLinhasContasFixas(tx)
    expect(linhas).toHaveLength(1)
    const luz = linhas.find((l) => l.transacaoId === 'tx-luz-manual')!
    expect(luz.nome).toBe('Luz')
    expect(luz.amountCents).toBe(12_000)
    expect(luz.isVariableAmount).toBe(false)
  })

  it('ordena em aberto primeiro (por vencimento), depois pagas', () => {
    const tx: FixaTransacao[] = [
      { id: 't-aluguel', descricao: 'Aluguel', status: 'PAGO', amountCents: 150_000, estimatedCents: null, dueDate: new Date(2026, 10, 5), isVariableAmount: false },
      { id: 't-net', descricao: 'Internet', status: 'EM_ABERTO', amountCents: 10_000, estimatedCents: null, dueDate: new Date(2026, 10, 15), isVariableAmount: false },
      { id: 't-luz', descricao: 'Luz', status: 'EM_ABERTO', amountCents: 0, estimatedCents: 18_000, dueDate: new Date(2026, 10, 10), isVariableAmount: true },
    ]
    const ordem = montarLinhasContasFixas(tx).map((l) => l.transacaoId)
    // em aberto por vencimento (luz dia 10 → net dia 15) → paga (aluguel)
    expect(ordem).toEqual(['t-luz', 't-net', 't-aluguel'])
  })
})

describe('computeChipsContasFixas (WARNING 4)', () => {
  it('Já pago = totalSpentPago; Variável = max(0, total − fixasPagas)', () => {
    // fixas: aluguel PAGO 150000; luz a definir EM_ABERTO estimativa 18000.
    // totalSpentPago = 170000 (aluguel 150000 + uma avulsa paga de 20000).
    const tx: FixaTransacao[] = [
      { id: 't1', descricao: 'Aluguel', status: 'PAGO', amountCents: 150_000, estimatedCents: null, dueDate: null, isVariableAmount: false },
      { id: 't2', descricao: 'Luz', status: 'EM_ABERTO', amountCents: 0, estimatedCents: 18_000, dueDate: null, isVariableAmount: true },
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
      { id: 't1', descricao: 'Aluguel', status: 'PAGO', amountCents: 150_000, estimatedCents: null, dueDate: null, isVariableAmount: false },
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
