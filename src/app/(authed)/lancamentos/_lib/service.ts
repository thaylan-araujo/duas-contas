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
 * Creates two linked transactions atomically:
 * - SAIDA on EMPRESA
 * - ENTRADA on CASA
 * Both share the same pairId generated here.
 * T-02-09: prisma.$transaction guarantees either both records are created or neither.
 */
export async function createProLaboreService(
  input: ProLaboreFormData & { userId: string }
) {
  const pairId = crypto.randomUUID()

  return prisma.$transaction(async (tx) => {
    const saida = await tx.transaction.create({
      data: {
        type: 'SAIDA',
        account: 'EMPRESA',
        description: 'Pró-labore',
        date: parseISO(input.date),
        amountCents: input.amountCents,
        categoryId: input.categoryId,
        userId: input.userId,
        pairId,
      },
    })

    const entrada = await tx.transaction.create({
      data: {
        type: 'ENTRADA',
        account: 'CASA',
        description: 'Pró-labore',
        date: parseISO(input.date),
        amountCents: input.amountCents,
        categoryId: input.categoryId,
        userId: input.userId,
        pairId,
      },
    })

    return { saida, entrada }
  })
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
      account: data.account,
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
