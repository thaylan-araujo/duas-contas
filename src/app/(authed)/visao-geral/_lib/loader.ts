import {
  getTotalEntradas,
  getTotalSpent,
  getCategorySpending,
  getWeeklySpending,
  getRendaPorOrigem,
  getEmAbertoCasa,
  getContasFixasLancamentosMes,
} from './service'
import { getFixedAccounts } from '@/app/(authed)/contas-fixas/_lib/service'
import { computeRestanteMes } from '@/app/(authed)/planejamento/_lib/acompanhamento'
import {
  computeComprometido,
  computePossoGastar,
  type EmAbertoLinha,
} from '@/app/(authed)/planejamento/_lib/comprometido'
import {
  montarLinhasContasFixas,
  computeChipsContasFixas,
  type LinhaContaFixa,
} from './contas-fixas-bloco'
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
  const isCasa = empresaId === null

  const [dinheiroMesCents, totalSpentCents, categorySpending, weeklySpending] =
    await Promise.all([
      getTotalEntradas(userId, month, empresaId),
      getTotalSpent(userId, month, empresaId),
      getCategorySpending(userId, month, empresaId),
      getWeeklySpending(userId, month, empresaId),
    ])

  const restanteCents = computeRestanteMes(dinheiroMesCents, totalSpentCents)

  // Hero "posso gastar ainda" (10-01, R-1/R-2): só no contexto Casa. EM_ABERTO é
  // Casa-SAIDA-only — no contexto empresa não lemos em aberto e os campos ficam 0.
  // No mesmo ramo Casa carregamos os lançamentos da categoria "Contas fixas" do
  // mês para o bloco (UAT Fase 10: inclui fixas geradas E avulsos digitados à mão)
  // e a matemática correta dos chips (WARNING 4). As fixas cadastradas são lidas só
  // para decidir se mostramos o botão "gerar contas do mês".
  const [emAbertoLinhas, fixedAccounts, contasFixasTx] = isCasa
    ? await Promise.all([
        getEmAbertoCasa(userId, month),
        getFixedAccounts(userId),
        getContasFixasLancamentosMes(userId, month),
      ])
    : [[] as EmAbertoLinha[], [], []]

  // comprometido = gasto real PAGO (totalSpent) + em aberto (valor certo ou
  // estimativa). posso gastar = dinheiro do mês − comprometido (pode negativar).
  const comprometidoCents = computeComprometido(totalSpentCents, emAbertoLinhas)
  const possoGastarCents = isCasa
    ? computePossoGastar(dinheiroMesCents, comprometidoCents)
    : 0

  // Chips do hero (WARNING 4 — matemática real das fixas, não aproximação):
  // Contas fixas = contribuição das fixas ao comprometido (PAGO=amountCents,
  // EM_ABERTO=estimativa/valor); Já pago = totalSpent PAGO; Variável gasto =
  // max(0, totalSpentPago − fixasPagas) (nunca negativo). No contexto empresa
  // não há fixas → chips caem no gasto PAGO (comportamento 10-01 preservado).
  const chips = isCasa
    ? computeChipsContasFixas(totalSpentCents, contasFixasTx)
    : {
        fixasPagasCents: 0,
        contasFixasCents: comprometidoCents - totalSpentCents,
        jaPagoCents: totalSpentCents,
        variavelCents: totalSpentCents,
      }

  // Linhas do bloco "Contas fixas" (UAT Fase 10): uma por lançamento da categoria
  // "Contas fixas" do mês — fixa gerada OU avulso. Só faz sentido no contexto Casa.
  const contasFixasLinhas: LinhaContaFixa[] = isCasa
    ? montarLinhasContasFixas(contasFixasTx)
    : []

  // O botão "gerar contas do mês" só é útil quando o usuário tem fixas cadastradas.
  const temFixasCadastradas = isCasa && fixedAccounts.length > 0

  return {
    dinheiroMesCents,
    totalSpentCents,
    restanteCents,
    categorySpending,
    weeklySpending,
    // Hero (Casa). No contexto empresa comprometido = totalSpent e possoGastar = 0.
    comprometidoCents,
    possoGastarCents,
    contasFixasCents: chips.contasFixasCents,
    jaPagoCents: chips.jaPagoCents,
    variavelCents: chips.variavelCents,
    // Bloco "Contas fixas" (10-02 / UAT Fase 10).
    contasFixasLinhas,
    temFixasCadastradas,
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
