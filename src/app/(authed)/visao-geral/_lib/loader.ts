import {
  getOrCreateMonthlyBudget,
  getTotalSpent,
  getCategorySpending,
  getWeeklySpending,
} from './service'

/**
 * Orchestrates all dashboard data fetches in parallel.
 * Called by the visao-geral Server Component page.
 *
 * O card "Planejado/Folga" do dashboard é retrabalhado no Plano 03b-03 — este
 * loader deixou de depender do total do plano manual (modelos removidos em
 * 03b-02) e devolve apenas budget, totalSpentCents, categorySpending e
 * weeklySpending.
 */
export async function loadDashboardData(
  userId: string,
  month: string,
  empresaId: string | null = null
) {
  const [budget, totalSpentCents, categorySpending, weeklySpending] =
    await Promise.all([
      getOrCreateMonthlyBudget(userId, month),
      getTotalSpent(userId, month, empresaId),
      getCategorySpending(userId, month, empresaId),
      getWeeklySpending(userId, month, empresaId),
    ])

  return {
    budget,
    totalSpentCents,
    categorySpending,
    weeklySpending,
  }
}
