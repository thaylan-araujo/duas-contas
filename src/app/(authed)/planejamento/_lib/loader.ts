// src/app/(authed)/planejamento/_lib/loader.ts
// Carregamento server-side do acompanhamento — sem 'use server' (chamado do
// Server Component). Monta: dinheiro do mês + restante (D-02), gasto por
// categoria vs teto (D-03) e o semanal automático por categoria (D-04).
import { getTotalEntradas, getTotalSpent } from '../../visao-geral/_lib/service'
import {
  getCasaCategorySpending,
  getCategoryBudgets,
  getOrCopyCategoryBudgets,
  getCasaWeeklyTransactions,
} from './service'
import {
  computeRestanteMes,
  computeCategoriaStatus,
  groupWeeklyByCategory,
  type CategoriaStatus,
  type SemanaCategoria,
} from './acompanhamento'

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

/** Uma categoria da Casa com o gasto do mês e seu status vs. o teto (D-03). */
export interface CategoriaAcompanhamento {
  categoryId: string
  name: string
  gastoCents: number
  limitCents: number | null
  status: CategoriaStatus
}

export interface AcompanhamentoData {
  month: string
  /** "Dinheiro do mês" = soma automática das ENTRADAS da Casa no mês — D-02/D-06. */
  dinheiroMesCents: number
  /** Despesas (SAIDA) da Casa no mês — D-02. */
  despesasMesCents: number
  /** dinheiro do mês − despesas (pode ser negativo) — D-02. */
  restanteCents: number
  /** Categorias da Casa com gasto e status vs. teto (D-03). */
  categorias: CategoriaAcompanhamento[]
  /** As 4 semanas com os totais por categoria (D-04). */
  semanas: SemanaCategoria[]
}

/**
 * Orquestra as buscas do acompanhamento da Casa em paralelo (D-02/D-03/D-04).
 * Copia os tetos do mês anterior (idempotente) antes de lê-los.
 */
export async function loadAcompanhamentoData(
  userId: string,
  month: string
): Promise<AcompanhamentoData> {
  if (!monthRegex.test(month)) {
    throw new Error('Formato de mês inválido')
  }

  // Auto-copy dos tetos do mês anterior (D-03) antes de ler os tetos deste mês.
  await getOrCopyCategoryBudgets(userId, month)

  const [
    dinheiroMesCents,
    despesasMesCents,
    categorySpending,
    budgets,
    weeklyTransactions,
  ] = await Promise.all([
    getTotalEntradas(userId, month, null), // dinheiro do mês = entradas Casa (D-02/D-06)
    getTotalSpent(userId, month, null), // despesas Casa do mês (D-02)
    getCasaCategorySpending(userId, month), // gasto por categoria (D-03)
    getCategoryBudgets(userId, month), // tetos do mês (D-03)
    getCasaWeeklyTransactions(userId, month), // lançamentos p/ o semanal (D-04)
  ])

  const restanteCents = computeRestanteMes(dinheiroMesCents, despesasMesCents)

  const categorias: CategoriaAcompanhamento[] = categorySpending.map((c) => {
    const limitCents = budgets.has(c.categoryId) ? budgets.get(c.categoryId)! : null
    return {
      categoryId: c.categoryId,
      name: c.name,
      gastoCents: c.totalCents,
      limitCents,
      status: computeCategoriaStatus({ gastoCents: c.totalCents, limitCents }),
    }
  })

  const semanas = groupWeeklyByCategory(weeklyTransactions, month)

  return {
    month,
    dinheiroMesCents,
    despesasMesCents,
    restanteCents,
    categorias,
    semanas,
  }
}
