// src/app/(authed)/planejamento/_lib/service.test.ts
// R-1: os gêmeos Casa dos leitores de SAIDA (getCasaCategorySpending e
// getCasaWeeklyTransactions) também filtram status='PAGO' — uma despesa
// EM_ABERTO não consome tetos nem o gasto semanal antes de ser paga.
//
// Mocka o Prisma client (`@/lib/prisma`) espelhando o padrão de
// lancamentos/_lib/service.test.ts (vi.hoisted + vi.mock).
import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = vi.hoisted(() => ({
  transaction: {
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
  getCasaCategorySpending,
  getCasaWeeklyTransactions,
} from './service'

const USER = 'user-1'
const MONTH = '2026-11'

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.transaction.groupBy.mockResolvedValue([])
  prismaMock.transaction.findMany.mockResolvedValue([])
  prismaMock.category.findMany.mockResolvedValue([])
})

describe('R-1 — gêmeos Casa filtram status=PAGO', () => {
  it('getCasaCategorySpending inclui status: PAGO (e Casa SAIDA) no where', async () => {
    await getCasaCategorySpending(USER, MONTH)
    expect(prismaMock.transaction.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          empresaId: null,
          type: 'SAIDA',
          status: 'PAGO',
        }),
      })
    )
  })

  it('getCasaWeeklyTransactions inclui status: PAGO (e Casa SAIDA) no where', async () => {
    await getCasaWeeklyTransactions(USER, MONTH)
    expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          empresaId: null,
          type: 'SAIDA',
          status: 'PAGO',
        }),
      })
    )
  })
})
