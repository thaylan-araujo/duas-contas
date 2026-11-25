// src/app/(authed)/canais/_lib/service.ts
// Queries empresaId-aware do P&L (Fatia 2). Espelham getCategorySpending de
// visao-geral/_lib/service.ts — mesma janela de mês (monthRegex) e groupBy por
// categoryId — trocando apenas o `type` (ENTRADA para receitas, SAIDA para
// custos). É uma VISÃO derivada dos lançamentos (D-01): nenhum modelo/migração.
// Toda query filtra por userId E empresaId (T-04b-02: nenhuma query sem escopo).
import { prisma } from '@/lib/prisma'

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * Agrega as transações de um `type` (ENTRADA/SAIDA) por categoria no mês, para o
 * contexto ativo (userId + empresaId), e resolve os nomes das categorias.
 * Devolve [{categoryId, name, totalCents}] ordenado desc por total — espelha
 * getCategorySpending de visao-geral trocando o `type`. Interno; exposto via
 * getReceitasPorCategoria / getCustosPorCategoria.
 */
async function getTotaisPorCategoria(
  userId: string,
  month: string,
  empresaId: string | null,
  type: 'ENTRADA' | 'SAIDA'
): Promise<Array<{ categoryId: string; name: string; totalCents: number }>> {
  if (!monthRegex.test(month)) throw new Error('Formato de mês inválido')
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999)

  const grouped = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      empresaId, // null = Casa; id = empresa ativa (T-04b-02)
      type,
      date: { gte: start, lte: end },
    },
    _sum: { amountCents: true },
  })

  if (grouped.length === 0) return []

  const categoryIds = grouped.map((g) => g.categoryId)
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds }, userId },
    select: { id: true, name: true },
  })

  const nameMap = new Map(categories.map((c) => [c.id, c.name]))

  return grouped
    .map((g) => ({
      categoryId: g.categoryId,
      name: nameMap.get(g.categoryId) ?? g.categoryId,
      totalCents: g._sum.amountCents ?? 0,
    }))
    .sort((a, b) => b.totalCents - a.totalCents)
}

/**
 * Receitas (ENTRADA) por categoria da empresa no mês (PNL-05 — receitas).
 * Espelha getCategorySpending com type ENTRADA.
 */
export async function getReceitasPorCategoria(
  userId: string,
  month: string,
  empresaId: string | null = null
): Promise<Array<{ categoryId: string; name: string; totalCents: number }>> {
  return getTotaisPorCategoria(userId, month, empresaId, 'ENTRADA')
}

/**
 * Custos (SAIDA) por categoria da empresa no mês (PNL-05 — custos).
 * Espelha getCategorySpending com type SAIDA.
 */
export async function getCustosPorCategoria(
  userId: string,
  month: string,
  empresaId: string | null = null
): Promise<Array<{ categoryId: string; name: string; totalCents: number }>> {
  return getTotaisPorCategoria(userId, month, empresaId, 'SAIDA')
}
