import { prisma } from '@/lib/prisma'
import {
  getOrCreateMonthlyBudget,
  getTotalSpent,
  getCategorySpending,
  getWeeklySpending,
} from './service'
import { getPlanTotal } from '../../planejamento/_lib/service'

/**
 * Orchestrates all dashboard data fetches in parallel.
 * Called by the visao-geral Server Component page.
 *
 * `planTotalCents` is the real plan total (persisted PlanItems + derived fixed
 * accounts). It is `null` only when the month has NO plan items AND NO fixed
 * accounts, so a brand-new month still shows the "--" fallback (03-UI-SPEC).
 */
export async function loadDashboardData(
  userId: string,
  month: string,
  empresaId: string | null = null
) {
  const [
    budget,
    totalSpentCents,
    categorySpending,
    weeklySpending,
    planTotalCents,
    hasPlanItem,
    hasFixedAccount,
  ] = await Promise.all([
    getOrCreateMonthlyBudget(userId, month),
    getTotalSpent(userId, month, empresaId),
    getCategorySpending(userId, month, empresaId),
    getWeeklySpending(userId, month, empresaId),
    getPlanTotal(userId, month),
    prisma.planItem.findFirst({ where: { userId, month }, select: { id: true } }),
    prisma.fixedAccount.findFirst({ where: { userId }, select: { id: true } }),
  ])

  const hasPlan = hasPlanItem !== null || hasFixedAccount !== null

  return {
    budget,
    totalSpentCents,
    categorySpending,
    weeklySpending,
    planTotalCents: hasPlan ? planTotalCents : null,
  }
}
