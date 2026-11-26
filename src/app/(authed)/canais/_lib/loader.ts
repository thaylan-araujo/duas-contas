// src/app/(authed)/canais/_lib/loader.ts
// Orquestra o P&L da empresa ativa (Fatia 2): busca os totais em paralelo
// (reaproveitando getTotalEntradas/getTotalSpent de visao-geral — D-01, nenhuma
// query nova para os totais) e aplica as funções puras de ./pnl. Padrão
// loadDashboardData (Promise.all).
import {
  getTotalEntradas,
  getTotalSpent,
} from '@/app/(authed)/visao-geral/_lib/service'
import { getReceitasPorCategoria, getCustosPorCategoria } from './service'
import {
  computeBruto,
  computeImpostos,
  computeLiquido,
  computeLucro,
  groupByCategory,
  type CategoriaTotal,
} from './pnl'
import { computeDasEstimado } from './das'

export interface PnlData {
  /** Faturamento bruto = soma das receitas (ENTRADA) no mês (PNL-02). */
  brutoCents: number
  /** Faturamento líquido = bruto − impostos (PNL-03). */
  liquidoCents: number
  /** Lucro = receitas − todos os custos SAIDA (PNL-04). */
  lucroCents: number
  /** Impostos = custos da categoria "Imposto" (D-02). */
  impostosCents: number
  /** DAS estimado do mês = alíquota × faturamento bruto (CONS-02 / D-03). */
  dasEstimadoCents: number
  /** Se a empresa tem alíquota definida — false → UI mostra "não definido" (D-03). */
  aliquotaDefinida: boolean
  /** Receitas por categoria, ordenadas desc (PNL-05). */
  receitasPorCategoria: CategoriaTotal[]
  /** Custos por categoria, ordenados desc (PNL-05). */
  custosPorCategoria: CategoriaTotal[]
}

/**
 * Carrega o P&L da empresa ativa para o mês, em paralelo, e aplica as funções
 * puras. `empresaId` deve ser o contexto já validado (posse checada na página).
 *
 * `aliquotaDasPercent` (D-03) é a alíquota da empresa já lida na página (null
 * quando não definida). O DAS estimado reutiliza o faturamento bruto já
 * calculado — nenhuma query nova. O consolidado (04d-03) reusa esta mesma fn.
 */
export async function loadPnlData(
  userId: string,
  month: string,
  empresaId: string | null = null,
  aliquotaDasPercent: number | null = null
): Promise<PnlData> {
  const [entradasCents, custosCents, receitasPorCategoria, custosPorCategoria] =
    await Promise.all([
      getTotalEntradas(userId, month, empresaId),
      getTotalSpent(userId, month, empresaId),
      getReceitasPorCategoria(userId, month, empresaId),
      getCustosPorCategoria(userId, month, empresaId),
    ])

  const brutoCents = computeBruto(entradasCents)
  const impostosCents = computeImpostos(custosPorCategoria)
  const liquidoCents = computeLiquido(brutoCents, impostosCents)
  const lucroCents = computeLucro(entradasCents, custosCents)
  const dasEstimadoCents = computeDasEstimado(aliquotaDasPercent, brutoCents)

  return {
    brutoCents,
    liquidoCents,
    lucroCents,
    impostosCents,
    dasEstimadoCents,
    aliquotaDefinida: aliquotaDasPercent !== null,
    receitasPorCategoria: groupByCategory(receitasPorCategoria),
    custosPorCategoria: groupByCategory(custosPorCategoria),
  }
}
