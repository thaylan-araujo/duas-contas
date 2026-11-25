import {
  getOrCreateMonthlyBudget,
  getTotalSpent,
  getCategorySpending,
  getWeeklySpending,
} from './service'
import { computeRestanteMes } from '@/app/(authed)/planejamento/_lib/acompanhamento'

/**
 * Orchestrates all dashboard data fetches in parallel.
 * Called by the visao-geral Server Component page.
 *
 * Modelo de acompanhamento (03b-03/D-06): o dashboard não depende mais do plano
 * manual (modelos PlanItem/WeeklySpend removidos em 03b-01/02). Devolve budget,
 * totalSpentCents, restanteCents, categorySpending e weeklySpending.
 *
 * `restanteCents` = dinheiro do mês (budget.ceilingCents) − despesas (SAIDA) no
 * mês. Reusa a função pura `computeRestanteMes` (fonte única do cálculo — ver
 * planejamento/_lib/acompanhamento.ts, D-02). O restante é significativo no
 * contexto Casa (empresaId null); no contexto de empresa não há "dinheiro do
 * mês"/teto — o card correspondente fica oculto na UI (ver DashboardCards).
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

  const restanteCents = computeRestanteMes(budget.ceilingCents, totalSpentCents)

  return {
    budget,
    totalSpentCents,
    restanteCents,
    categorySpending,
    weeklySpending,
  }
}
