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

export interface PnlData {
  /** Faturamento bruto = soma das receitas (ENTRADA) no mês (PNL-02). */
  brutoCents: number
  /** Faturamento líquido = bruto − impostos (PNL-03). */
  liquidoCents: number
  /** Lucro = receitas − todos os custos SAIDA (PNL-04). */
  lucroCents: number
  /** Impostos = custos da categoria "Imposto" (D-02). */
  impostosCents: number
  /** Receitas por categoria, ordenadas desc (PNL-05). */
  receitasPorCategoria: CategoriaTotal[]
  /** Custos por categoria, ordenados desc (PNL-05). */
  custosPorCategoria: CategoriaTotal[]
}

/**
 * Carrega o P&L da empresa ativa para o mês, em paralelo, e aplica as funções
 * puras. `empresaId` deve ser o contexto já validado (posse checada na página).
 */
export async function loadPnlData(
  userId: string,
  month: string,
  empresaId: string | null = null
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

  return {
    brutoCents,
    liquidoCents,
    lucroCents,
    impostosCents,
    receitasPorCategoria: groupByCategory(receitasPorCategoria),
    custosPorCategoria: groupByCategory(custosPorCategoria),
  }
}
