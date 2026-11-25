import {
  getTotalEntradas,
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
 * manual (modelos PlanItem/WeeklySpend removidos em 03b-01/02) nem de
 * MonthlyBudget.ceilingCents como "dinheiro do mês".
 *
 * `dinheiroMesCents` = soma automática das ENTRADAS da Casa no mês (não
 * editável). `restanteCents` = dinheiro do mês − despesas (SAIDA) no mês,
 * reusando a função pura `computeRestanteMes` (fonte única — ver
 * planejamento/_lib/acompanhamento.ts, D-02). O restante é significativo no
 * contexto Casa (empresaId null); no contexto de empresa o card "Dinheiro do
 * mês"/"Restante" fica oculto na UI (ver DashboardCards).
 */
export async function loadDashboardData(
  userId: string,
  month: string,
  empresaId: string | null = null
) {
  const [dinheiroMesCents, totalSpentCents, categorySpending, weeklySpending] =
    await Promise.all([
      getTotalEntradas(userId, month, empresaId),
      getTotalSpent(userId, month, empresaId),
      getCategorySpending(userId, month, empresaId),
      getWeeklySpending(userId, month, empresaId),
    ])

  const restanteCents = computeRestanteMes(dinheiroMesCents, totalSpentCents)

  return {
    dinheiroMesCents,
    totalSpentCents,
    restanteCents,
    categorySpending,
    weeklySpending,
  }
}
