// src/app/(authed)/visao-geral/_lib/service.test.ts
// R-1: os leitores de CAIXA REAL (SAIDA) da Casa filtram status='PAGO' — uma
// despesa EM_ABERTO não consome o gasto real/semanal/tetos antes de ser paga.
// As ENTRADAS NÃO são filtradas. getEmAbertoCasa devolve só as linhas SAIDA
// EM_ABERTO da Casa no shape que computeComprometido consome.
//
// Mocka o Prisma client (`@/lib/prisma`) espelhando o padrão de
// lancamentos/_lib/service.test.ts (vi.hoisted + vi.mock) e inspeciona o `where`
// passado a aggregate/groupBy/findMany.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  transaction: {
    aggregate: vi.fn(),
    groupBy: vi.fn(),
    findMany: vi.fn(),
  },
  category: {
    findMany: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

import {
  getTotalSpent,
  getCategorySpending,
  getWeeklySpending,
  getTotalEntradas,
  getRendaPorOrigem,
  getEmAbertoCasa,
} from './service'

const USER = 'user-1'
const MONTH = '2026-11'

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amountCents: 0 } })
  prismaMock.transaction.groupBy.mockResolvedValue([])
  prismaMock.transaction.findMany.mockResolvedValue([])
  prismaMock.category.findMany.mockResolvedValue([])
})

describe('R-1 — leitores de SAIDA filtram status=PAGO', () => {
  it('getTotalSpent inclui status: PAGO no where', async () => {
    await getTotalSpent(USER, MONTH, null)
    expect(prismaMock.transaction.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'SAIDA', status: 'PAGO' }),
      })
    )
  })

  it('getCategorySpending inclui status: PAGO no where', async () => {
    await getCategorySpending(USER, MONTH, null)
    expect(prismaMock.transaction.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'SAIDA', status: 'PAGO' }),
      })
    )
  })

  it('getWeeklySpending inclui status: PAGO no where', async () => {
    await getWeeklySpending(USER, MONTH, null)
    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'SAIDA', status: 'PAGO' }),
      })
    )
  })
})

describe('R-1 — ENTRADAS NÃO são filtradas por status', () => {
  it('getTotalEntradas NÃO inclui status no where', async () => {
    await getTotalEntradas(USER, MONTH, null)
    const where = prismaMock.transaction.aggregate.mock.calls[0][0].where
    expect(where).toEqual(expect.objectContaining({ type: 'ENTRADA' }))
    expect(where).not.toHaveProperty('status')
  })

  it('getRendaPorOrigem NÃO inclui status no where', async () => {
    await getRendaPorOrigem(USER, MONTH)
    const where = prismaMock.transaction.groupBy.mock.calls[0][0].where
    expect(where).toEqual(expect.objectContaining({ type: 'ENTRADA' }))
    expect(where).not.toHaveProperty('status')
  })
})

describe('getEmAbertoCasa (hero — Casa SAIDA EM_ABERTO)', () => {
  it('lê só linhas SAIDA, EM_ABERTO, Casa (empresaId null) do mês', async () => {
    await getEmAbertoCasa(USER, MONTH)
    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: USER,
          empresaId: null,
          type: 'SAIDA',
          status: 'EM_ABERTO',
        }),
      })
    )
  })

  it('mapeia para EmAbertoLinha { amountCents, estimatedCents, isVariableAmount }', async () => {
    prismaMock.transaction.findMany.mockResolvedValueOnce([
      // conta certa (sem fixa vinculada → isVariableAmount false)
      { amountCents: 15_000, estimatedCents: null, fixedAccount: null },
      // conta "a definir" (fixa com isVariableAmount true)
      {
        amountCents: 0,
        estimatedCents: 8_000,
        fixedAccount: { isVariableAmount: true },
      },
    ])
    const linhas = await getEmAbertoCasa(USER, MONTH)
    expect(linhas).toEqual([
      { amountCents: 15_000, estimatedCents: null, isVariableAmount: false },
      { amountCents: 0, estimatedCents: 8_000, isVariableAmount: true },
    ])
  })
})
