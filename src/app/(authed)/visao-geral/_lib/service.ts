import { prisma } from '@/lib/prisma'
import { weekIndexForDay } from '@/lib/weeks'
import type { EmAbertoLinha } from '@/app/(authed)/planejamento/_lib/comprometido'

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * Returns the MonthlyBudget for the given user+month.
 * If none exists, copies ceilingCents from the most recent previous month,
 * or falls back to R$ 3.000,00 (300_000 cents) — D-04.
 */
export async function getOrCreateMonthlyBudget(userId: string, month: string) {
  // 1. Try exact match
  const existing = await prisma.monthlyBudget.findUnique({
    where: { userId_month: { userId, month } },
  })
  if (existing) return existing

  // 2. Find most recent previous month's budget for fallback
  const previous = await prisma.monthlyBudget.findFirst({
    where: { userId, month: { lt: month } },
    orderBy: { month: 'desc' },
  })
  const ceilingCents = previous?.ceilingCents ?? 300_000

  // 3. Upsert (create if still missing)
  return prisma.monthlyBudget.upsert({
    where: { userId_month: { userId, month } },
    update: {},
    create: { userId, month, ceilingCents },
  })
}

/**
 * Explicitly updates (or creates) the monthly budget ceiling.
 * Called when the user edits the ceiling via InlineCeilingEditor — D-03.
 */
export async function upsertMonthlyBudget(
  userId: string,
  month: string,
  ceilingCents: number
) {
  return prisma.monthlyBudget.upsert({
    where: { userId_month: { userId, month } },
    update: { ceilingCents },
    create: { userId, month, ceilingCents },
  })
}

/**
 * Returns the total amount spent (SAIDA) in a given month for the active context.
 * empresaId: null = Casa (empresaId IS NULL) | string = empresa específica. (EMPF-06)
 */
export async function getTotalSpent(
  userId: string,
  month: string,
  empresaId: string | null = null
): Promise<number> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999)

  const result = await prisma.transaction.aggregate({
    _sum: { amountCents: true },
    where: {
      userId,
      empresaId, // null = Casa; id = empresa ativa
      type: 'SAIDA',
      status: 'PAGO', // R-1: gasto real conta só o que foi pago (EM_ABERTO só no hero)
      date: { gte: start, lte: end },
    },
  })
  return result._sum.amountCents ?? 0
}

/**
 * Returns the total income (ENTRADA) in a given month for the active context.
 * É o "dinheiro do mês" (D-02/D-06): soma automática das entradas, não editável.
 * empresaId: null = Casa (empresaId IS NULL) | string = empresa específica.
 */
export async function getTotalEntradas(
  userId: string,
  month: string,
  empresaId: string | null = null
): Promise<number> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999)

  const result = await prisma.transaction.aggregate({
    _sum: { amountCents: true },
    where: {
      userId,
      empresaId, // null = Casa; id = empresa ativa
      type: 'ENTRADA',
      date: { gte: start, lte: end },
    },
  })
  return result._sum.amountCents ?? 0
}

/**
 * Agrega as ENTRADAS da Casa do mês por empresa de ORIGEM (PL-05/D-04).
 *
 * É Casa-only: `empresaId` é SEMPRE null aqui (a renda familiar é da Casa). O
 * agrupamento é pelo `origemEmpresaId` — a empresa DE ONDE o dinheiro veio
 * (preenchido pelo pró-labore em 04c-02); `origemEmpresaId` null = entrada sem
 * origem (ex.: salário → "Outras entradas"). Sempre filtra por userId
 * (T-04c-08 — nunca query sem escopo). A soma dos `totalCents` resultantes é
 * igual a getTotalEntradas (Casa) — mesma janela de mês.
 */
export async function getRendaPorOrigem(
  userId: string,
  month: string
): Promise<Array<{ origemEmpresaId: string | null; totalCents: number }>> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999)

  const grouped = await prisma.transaction.groupBy({
    by: ['origemEmpresaId'],
    where: {
      userId,
      empresaId: null, // Casa: a renda familiar é SEMPRE da Casa
      type: 'ENTRADA',
      date: { gte: start, lte: end },
    },
    _sum: { amountCents: true },
  })

  return grouped.map((g) => ({
    origemEmpresaId: g.origemEmpresaId,
    totalCents: g._sum.amountCents ?? 0,
  }))
}

/**
 * Returns spending per category for CASA SAIDA transactions in a month,
 * sorted descending by total (highest spend first).
 */
export async function getCategorySpending(
  userId: string,
  month: string,
  empresaId: string | null = null
): Promise<Array<{ categoryId: string; name: string; totalCents: number }>> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999)

  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      empresaId, // null = Casa; id = empresa ativa
      type: 'SAIDA',
      status: 'PAGO', // R-1: tetos/categoria contam só o que foi pago
      date: { gte: start, lte: end },
    },
    _sum: { amountCents: true },
  })

  if (grouped.length === 0) return []

  const categoryIds = grouped.map((g) => g.categoryId)
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  })

  const nameMap = new Map(categories.map((c) => [c.id, c.name]))

  return grouped
    .map((g) => ({
      categoryId: g.categoryId,
      name: nameMap.get(g.categoryId) ?? g.categoryId,
      totalCents: g._sum.amountCents ?? 0,
    }))
    .sort((a, b) => b.totalCents - a.totalCents)
}

/**
 * Returns weekly spending buckets for CASA SAIDA transactions in a month.
 * Week buckets: day 1-7 → Sem 1, 8-14 → Sem 2, 15-21 → Sem 3, 22+ → Sem 4.
 */
export async function getWeeklySpending(
  userId: string,
  month: string,
  empresaId: string | null = null
): Promise<Array<{ week: string; totalCents: number }>> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      empresaId, // null = Casa; id = empresa ativa
      type: 'SAIDA',
      status: 'PAGO', // R-1: semanal conta só o que foi pago
      date: { gte: start, lte: end },
    },
    select: { date: true, amountCents: true },
  })

  const buckets = [
    { week: 'Sem 1', totalCents: 0 },
    { week: 'Sem 2', totalCents: 0 },
    { week: 'Sem 3', totalCents: 0 },
    { week: 'Sem 4', totalCents: 0 },
  ]

  for (const tx of transactions) {
    const day = new Date(tx.date).getDate()
    const index = weekIndexForDay(day)
    buckets[index].totalCents += tx.amountCents
  }

  return buckets
}

/**
 * Lê as linhas SAIDA EM_ABERTO da Casa (empresaId null) do mês — a parcela que o
 * hero "posso gastar ainda" desconta além do gasto real (R-1: EM_ABERTO só entra
 * aqui, nunca em getTotalSpent/getCategorySpending/getWeeklySpending). Devolve no
 * shape `EmAbertoLinha` que a função pura `computeComprometido` consome:
 * `isVariableAmount` vem da fixa vinculada (null → false). Sempre escopado por
 * userId (IDOR — T-10-05). Reusa a mesma janela de mês dos outros leitores.
 */
export async function getEmAbertoCasa(
  userId: string,
  month: string
): Promise<EmAbertoLinha[]> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999)

  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      empresaId: null, // Casa: EM_ABERTO é Casa-SAIDA-only nesta fase
      type: 'SAIDA',
      status: 'EM_ABERTO',
      date: { gte: start, lte: end },
    },
    select: {
      amountCents: true,
      estimatedCents: true,
      fixedAccount: { select: { isVariableAmount: true } },
    },
  })

  return rows.map((r) => ({
    amountCents: r.amountCents,
    estimatedCents: r.estimatedCents,
    isVariableAmount: r.fixedAccount?.isVariableAmount ?? false,
  }))
}
