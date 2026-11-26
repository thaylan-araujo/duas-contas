import {
  getTotalEntradas,
  getTotalSpent,
  getCategorySpending,
  getWeeklySpending,
  getRendaPorOrigem,
} from './service'
import { computeRestanteMes } from '@/app/(authed)/planejamento/_lib/acompanhamento'
import { getEmpresas } from '@/app/(authed)/empresas/_lib/loader'
import {
  agruparRendaPorOrigem,
  type EmpresaInfo,
  type LinhaRendaPorOrigem,
} from './renda-familiar'

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

/**
 * Carrega a "Renda familiar por origem" da Casa do mês (PL-05/D-04).
 *
 * Em paralelo: agrega as ENTRADAS da Casa por `origemEmpresaId` (service) e
 * busca as empresas do usuário (para nome + cor das linhas). Combina os dois
 * com a função pura `agruparRendaPorOrigem` (fonte única da ordenação e dos
 * rótulos — "Outras entradas"/"Empresa removida").
 *
 * Separado de `loadDashboardData` (que serve Casa e empresa): a renda familiar
 * é um conceito da Casa, então este loader só é chamado no ramo Casa da página.
 * A soma das linhas resultantes é igual ao "Dinheiro do mês" (getTotalEntradas).
 */
export async function loadRendaFamiliar(
  userId: string,
  month: string
): Promise<LinhaRendaPorOrigem[]> {
  const [rendaPorOrigem, empresas] = await Promise.all([
    getRendaPorOrigem(userId, month),
    getEmpresas(userId),
  ])

  const empresasMap = new Map<string, EmpresaInfo>(
    empresas.map((e) => [e.id, { nome: e.nome, cor: e.cor }])
  )

  return agruparRendaPorOrigem(rendaPorOrigem, empresasMap)
}
