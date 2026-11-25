// src/app/(authed)/empresas/_lib/loader.ts
// Módulo simples (sem 'use server') — leituras da rota /empresas.
// Ownership-guarded: toda query filtra por userId (ASVS V4).
import { prisma } from '@/lib/prisma'

/** Empresas do usuário, em ordem de criação (D-05). */
export async function getEmpresas(userId: string) {
  return prisma.empresa.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
}

/** Categorias de uma empresa específica (receitas/custos por kind). */
export async function getCategoriasPorEmpresa(userId: string, empresaId: string) {
  return prisma.category.findMany({
    where: { userId, empresaId },
    orderBy: { name: 'asc' },
  })
}

/** Contagem de lançamentos por empresa — a página usa para escolher Caso A/B do Dialog. */
export async function getLancamentoCountPorEmpresa(
  userId: string
): Promise<Record<string, number>> {
  const grouped = await prisma.transaction.groupBy({
    by: ['empresaId'],
    where: { userId, empresaId: { not: null } },
    _count: { _all: true },
  })
  const result: Record<string, number> = {}
  for (const g of grouped) {
    if (g.empresaId) result[g.empresaId] = g._count._all
  }
  return result
}

/**
 * Carrega, em paralelo, as empresas + suas categorias + a contagem de lançamentos.
 * Retorna cada empresa com suas categorias já embutidas para a página montar
 * a lista + a seção de categorias por empresa.
 */
export async function loadEmpresasData(userId: string) {
  const [empresas, counts] = await Promise.all([
    getEmpresas(userId),
    getLancamentoCountPorEmpresa(userId),
  ])

  const categoriasPorEmpresa = await Promise.all(
    empresas.map((e) => getCategoriasPorEmpresa(userId, e.id))
  )

  const empresasComCategorias = empresas.map((e, i) => ({
    ...e,
    categorias: categoriasPorEmpresa[i],
    lancamentoCount: counts[e.id] ?? 0,
  }))

  return { empresas: empresasComCategorias }
}
