// src/app/(authed)/planejamento/_lib/service.ts
// Acesso Prisma do acompanhamento da Casa (D-02/D-03/D-04). Sem 'use server'
// (módulo comum). As funções de cálculo puras vivem em acompanhamento.ts.
// Todas as queries filtram por userId e forçam a Casa (empresaId null).
import { prisma } from '@/lib/prisma'
import type { WeeklyTransactionInput } from './acompanhamento'

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

/** Intervalo [start, end] do mês inteiro (end inclui 23:59:59.999 do último dia). */
function monthRange(month: string): { start: Date; end: Date } {
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999)
  return { start, end }
}

/**
 * Gasto do mês por categoria da Casa (SAIDA) — D-03. Espelha getCategorySpending
 * de visao-geral mas fixo na Casa (empresaId null). Ordenado por gasto desc.
 */
export async function getCasaCategorySpending(
  userId: string,
  month: string
): Promise<Array<{ categoryId: string; name: string; totalCents: number }>> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')
  const { start, end } = monthRange(month)

  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      empresaId: null, // Casa
      type: 'SAIDA',
      date: { gte: start, lte: end },
    },
    _sum: { amountCents: true },
  })

  if (grouped.length === 0) return []

  const categoryIds = grouped.map((g) => g.categoryId)
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds }, userId },
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
 * Mapa categoryId → limitCents dos tetos do mês (D-03). Ausência de uma chave
 * significa "sem teto". Sempre escopado por userId (T-03b-12).
 */
export async function getCategoryBudgets(
  userId: string,
  month: string
): Promise<Map<string, number>> {
  const rows = await prisma.categoryBudget.findMany({
    where: { userId, month },
    select: { categoryId: true, limitCents: true },
  })
  return new Map(rows.map((r) => [r.categoryId, r.limitCents]))
}

/**
 * Se o mês não tem nenhum CategoryBudget mas existe um mês anterior com tetos,
 * copia os tetos do mês anterior mais recente para o mês atual (D-03) — espelha
 * o auto-copy do MonthlyBudget. Idempotente: não faz nada se o mês já tem tetos.
 * Chamada pelo loader antes de ler os tetos. Escopada por userId.
 */
export async function getOrCopyCategoryBudgets(
  userId: string,
  month: string
): Promise<void> {
  const existing = await prisma.categoryBudget.count({ where: { userId, month } })
  if (existing > 0) return

  const mostRecentPrior = await prisma.categoryBudget.findFirst({
    where: { userId, month: { lt: month } },
    orderBy: { month: 'desc' },
    select: { month: true },
  })
  if (!mostRecentPrior) return

  const priorBudgets = await prisma.categoryBudget.findMany({
    where: { userId, month: mostRecentPrior.month },
    select: { categoryId: true, limitCents: true },
  })
  if (priorBudgets.length === 0) return

  await prisma.$transaction(
    priorBudgets.map((b) =>
      prisma.categoryBudget.upsert({
        where: {
          userId_month_categoryId: { userId, month, categoryId: b.categoryId },
        },
        update: {},
        create: {
          userId,
          month,
          categoryId: b.categoryId,
          limitCents: b.limitCents,
        },
      })
    )
  )
}

/**
 * Lançamentos Casa SAIDA do mês (date, amountCents, categoryId, categoryName)
 * para alimentar groupWeeklyByCategory (função pura — D-04). Casa fixa
 * (empresaId null) e sempre filtrado por userId.
 */
export async function getCasaWeeklyTransactions(
  userId: string,
  month: string
): Promise<WeeklyTransactionInput[]> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')
  const { start, end } = monthRange(month)

  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      empresaId: null, // Casa
      type: 'SAIDA',
      date: { gte: start, lte: end },
    },
    select: {
      date: true,
      amountCents: true,
      categoryId: true,
      category: { select: { name: true } },
    },
    orderBy: { date: 'asc' },
  })

  return rows.map((r) => ({
    date: r.date,
    amountCents: r.amountCents,
    categoryId: r.categoryId,
    categoryName: r.category.name,
  }))
}

/**
 * Define/edita o teto de uma categoria (D-03). Upsert pela unique composta
 * (userId, month, categoryId). IDOR (T-03b-10/T-03b-12): userId sempre da
 * sessão (recebido do action, nunca do form).
 */
export async function upsertCategoryBudgetService(
  userId: string,
  month: string,
  categoryId: string,
  limitCents: number
) {
  return prisma.categoryBudget.upsert({
    where: {
      userId_month_categoryId: { userId, month, categoryId },
    },
    update: { limitCents },
    create: { userId, month, categoryId, limitCents },
  })
}

/**
 * Remove o teto de uma categoria (→ volta a "sem teto"). deleteMany escopado
 * por userId (T-03b-12): um usuário só apaga os próprios tetos.
 */
export async function deleteCategoryBudgetService(
  userId: string,
  month: string,
  categoryId: string
) {
  return prisma.categoryBudget.deleteMany({
    where: { userId, month, categoryId },
  })
}
