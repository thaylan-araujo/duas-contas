// src/app/(authed)/lancamentos/_lib/loader.ts
// Server-side data loading utilities — no 'use server' (called from Server Components directly)
import { prisma } from '@/lib/prisma'
import { ContaType } from '@prisma/client'

/**
 * Loads transactions for a user filtered by month and optionally by account.
 * month: "YYYY-MM" string from URL search params.
 * account: "CASA" | "EMPRESA" | undefined — if undefined, returns all accounts.
 */
const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

export async function getTransactions(
  userId: string,
  month: string,
  account?: string
) {
  if (!monthRegex.test(month)) {
    throw new Error('Formato de mês inválido')
  }
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0, 23, 59, 59, 999)

  return prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
      ...(account ? { account: account as ContaType } : {}),
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  })
}

/**
 * Returns all categories for the given user, ordered by name.
 * Used by page.tsx to pass to TransactionSheet.
 */
export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  })
}
