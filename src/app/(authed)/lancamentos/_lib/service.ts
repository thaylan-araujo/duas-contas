// src/app/(authed)/lancamentos/_lib/service.ts
// Pure TypeScript business logic — no 'use server'
import { parseISO } from 'date-fns'
import { prisma } from '@/lib/prisma'
import type { TransactionFormData, ProLaboreFormData, CategoryCreateData } from './schema'

/**
 * Returns all categories for the given user, ordered by name.
 */
export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })
}

/**
 * Creates a new transaction for the user.
 * Uses parseISO to convert "YYYY-MM-DD" string to a Date — prevents timezone drift.
 */
export async function createTransactionService(
  data: TransactionFormData & { userId: string }
) {
  const { date, userId, ...rest } = data
  return prisma.transaction.create({
    data: {
      ...rest,
      date: parseISO(date),
      userId,
    },
  })
}

/**
 * Updates an existing transaction.
 * Guards: userId ownership check + pairId guard (D-06).
 */
export async function updateTransactionService(
  id: string,
  userId: string,
  data: Partial<TransactionFormData>
) {
  const record = await prisma.transaction.findFirst({
    where: { id, userId },
  })

  if (!record) {
    throw new Error('Lançamento não encontrado.')
  }

  if (record.pairId !== null) {
    throw new Error('PAIRED_TRANSACTION')
  }

  const { date, ...rest } = data

  return prisma.transaction.update({
    where: { id },
    data: {
      ...rest,
      ...(date ? { date: parseISO(date) } : {}),
    },
  })
}

/**
 * Deletes a transaction.
 * Guards: userId ownership check + pairId guard (D-06).
 */
export async function deleteTransactionService(id: string, userId: string) {
  const record = await prisma.transaction.findFirst({
    where: { id, userId },
  })

  if (!record) {
    throw new Error('Lançamento não encontrado.')
  }

  if (record.pairId !== null) {
    throw new Error('PAIRED_TRANSACTION')
  }

  return prisma.transaction.delete({
    where: { id },
  })
}

// ---------------------------------------------------------------------------
// Pró-labore services (LANC-05)
// ---------------------------------------------------------------------------

/**
 * Mensagem de deferimento do pró-labore multi-origem (Open Question 3 / 04-RESEARCH).
 * O pró-labore mapeava SAIDA na Empresa → ENTRADA na Casa usando o antigo enum
 * `account`. Com o eixo empresaId (null = Casa), a mecânica correta precisa saber
 * DE QUAL empresa sai o pró-labore, e isso depende da seleção de contexto que só
 * chega numa fatia futura. Deixar ambos os lados com empresaId:null registraria
 * a transferência como um lançamento comum da Casa (semântica errada) — por isso
 * o fluxo é DESABILITADO nesta fatia em vez de neutralizado silenciosamente.
 */
export const PRO_LABORE_DEFERRED_MESSAGE =
  'O pró-labore multi-empresa chega em uma próxima fatia.'

/**
 * DESABILITADO nesta fatia (04-02). A criação de pró-labore está deferida: a
 * transferência Empresa → Casa precisa da origem (empresaId da empresa) que ainda
 * não é selecionável. Lança um erro claro em vez de gravar empresaId:null nos dois
 * lados (que mascararia a transferência como lançamento comum da Casa).
 * A assinatura é mantida para compatibilidade de chamada; o fluxo real retorna
 * na fatia de pró-labore multi-origem (deferred em 04-CONTEXT).
 */
export async function createProLaboreService(
  _input: ProLaboreFormData & { userId: string }
): Promise<never> {
  throw new Error(PRO_LABORE_DEFERRED_MESSAGE)
}

/**
 * Deletes both transactions in a pró-labore pair atomically.
 * T-02-10: userId filter ensures user can only delete their own pró-labore pairs.
 */
export async function deleteProLaboreService(pairId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany({
      where: { pairId, userId },
    })
  })
}

// ---------------------------------------------------------------------------
// Category services (LANC-06)
// ---------------------------------------------------------------------------

/**
 * Creates a new custom category for the user.
 * T-02-13: userId is always set, so categories are user-scoped.
 */
export async function createCategoryService(
  data: CategoryCreateData & { userId: string }
) {
  return prisma.category.create({
    data: {
      name: data.name,
      empresaId: data.empresaId, // null = Casa
      kind: data.kind ?? null,
      userId: data.userId,
      isDefault: false,
    },
  })
}

/**
 * Updates the name of a user-created category.
 * T-02-12: throws if the category is a default category (isDefault: true).
 * T-02-13: findFirst with { id, userId } ensures ownership.
 */
export async function updateCategoryService(
  id: string,
  userId: string,
  name: string
) {
  const record = await prisma.category.findFirst({
    where: { id, userId },
  })

  if (!record) {
    throw new Error('Categoria não encontrada.')
  }

  if (record.isDefault) {
    throw new Error('Categorias padrão não podem ser editadas.')
  }

  return prisma.category.update({
    where: { id },
    data: { name },
  })
}

/**
 * Deletes a user-created category.
 * T-02-11: counts linked transactions; throws if count > 0 — never cascades deletion (D-08).
 * T-02-12: throws if category is a default category.
 * T-02-13: findFirst with { id, userId } ensures ownership.
 */
export async function deleteCategoryService(id: string, userId: string) {
  const record = await prisma.category.findFirst({
    where: { id, userId },
  })

  if (!record) {
    throw new Error('Categoria não encontrada.')
  }

  if (record.isDefault) {
    throw new Error('Categorias padrão não podem ser excluídas.')
  }

  const count = await prisma.transaction.count({
    where: { categoryId: id, userId },
  })

  if (count > 0) {
    const word = count === 1 ? 'lançamento' : 'lançamentos'
    throw new Error(`Esta categoria tem ${count} ${word} e não pode ser excluída.`)
  }

  return prisma.category.delete({
    where: { id },
  })
}
