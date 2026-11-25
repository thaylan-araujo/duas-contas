// src/app/(authed)/planejamento/_lib/loader.ts
// Server-side data loading — no 'use server' (called from the Server Component).
import { prisma } from '@/lib/prisma'
import { getOrCreateMonthlyBudget } from '../../visao-geral/_lib/service'
import { getCategories } from '../../lancamentos/_lib/service'
import { getOrCreatePlan, getPlanItemsWithCategory } from './service'

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * Orchestrates the /planejamento data fetches in parallel.
 *
 * Returns:
 * - planItems: items for the month, joined with their grupo (category)
 * - budget: MonthlyBudget (teto) — reused from Fase 2 (PLAN-01)
 * - casaCategories: Casa categories for the item Sheet's "Grupo" Select (D-03)
 * - hasPreviousPlan: whether a prior month has plan items (enables the copy button, PLAN-05)
 */
export async function loadPlanData(userId: string, month: string) {
  if (!monthRegex.test(month)) {
    throw new Error('Formato de mês inválido')
  }

  // getOrCreatePlan pre-fills the first month (D-04) — run it first so the
  // subsequent getPlanItemsWithCategory sees any just-created rows.
  await getOrCreatePlan(userId, month)

  const [budget, planItems, allCategories, prior] = await Promise.all([
    getOrCreateMonthlyBudget(userId, month),
    getPlanItemsWithCategory(userId, month),
    getCategories(userId),
    prisma.planItem.findFirst({ where: { userId, month: { lt: month } } }),
  ])

  const casaCategories = allCategories.filter((c) => c.account === 'CASA')
  const hasPreviousPlan = prior !== null

  return { planItems, budget, casaCategories, hasPreviousPlan }
}
