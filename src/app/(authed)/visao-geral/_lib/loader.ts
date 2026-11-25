import {
  getOrCreateMonthlyBudget,
  getTotalSpent,
  getCategorySpending,
  getWeeklySpending,
} from './service'

/**
 * Orchestrates all dashboard data fetches in parallel.
 * Called by the visao-geral Server Component page.
 */
export async function loadDashboardData(userId: string, month: string) {
  const [budget, totalSpentCents, categorySpending, weeklySpending] =
    await Promise.all([
      getOrCreateMonthlyBudget(userId, month),
      getTotalSpent(userId, month),
      getCategorySpending(userId, month),
      getWeeklySpending(userId, month),
    ])

  return { budget, totalSpentCents, categorySpending, weeklySpending }
}
