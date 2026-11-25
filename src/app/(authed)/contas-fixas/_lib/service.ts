// src/app/(authed)/contas-fixas/_lib/service.ts
// Pure TypeScript business logic — no 'use server'.
// Pure display calc (computeAnnualMonthly / computeGoalMonthly) carry the
// correction risk (FIXA-02 / META-01) and are unit-tested without Prisma.
import { differenceInCalendarMonths, parse } from 'date-fns'
import { prisma } from '@/lib/prisma'
import type {
  FixedAccountFormData,
  AnnualExpenseFormData,
  GoalFormData,
} from './schema'

// ---------------------------------------------------------------------------
// Pure display calculations (no Prisma) — D-05 / META-01, Pitfalls 1 & 3
// ---------------------------------------------------------------------------

/**
 * "Guardar por mês" de um gasto anual = valor no ano ÷ 12 (D-05, FIXA-02).
 * Display only — nunca vira meta. Math.round para resolver frações de centavo
 * (Pitfall 1). Ex.: 100000 (R$1.000,00/ano) → 8333 (R$83,33/mês).
 */
export function computeAnnualMonthly(yearlyCents: number): number {
  return Math.round(yearlyCents / 12)
}

/** Shape mínimo de uma meta para o cálculo "guardar por mês". */
export interface GoalMonthlyInput {
  targetCents: number
  savedCents: number
  deadline: string | null | undefined // 'YYYY-MM'
}

/**
 * "Guardar por mês" para chegar na meta = (meta − guardado) ÷ meses até o prazo
 * (D-06, META-01, spec §Cálculos).
 *
 * Guard de divisão por zero/negativa (Pitfall 3):
 * - deadline null/undefined → retorna null (não divide).
 * - prazo no passado OU igual ao mês atual (meses ≤ 0) → retorna null.
 * Caso contrário: Math.round((meta − guardado) / meses).
 *
 * Usa date-fns differenceInCalendarMonths (não hand-roll — 03-RESEARCH §Don't
 * Hand-Roll) para lidar corretamente com viradas de ano.
 */
export function computeGoalMonthly(
  goal: GoalMonthlyInput,
  now: Date = new Date()
): number | null {
  if (!goal.deadline) return null

  // parse 'YYYY-MM' para uma Date (primeiro dia do mês do prazo).
  const deadlineDate = parse(goal.deadline, 'yyyy-MM', new Date())
  const months = differenceInCalendarMonths(deadlineDate, now)

  if (months <= 0) return null

  return Math.round((goal.targetCents - goal.savedCents) / months)
}

// ---------------------------------------------------------------------------
// FixedAccount CRUD (FIXA-01) — ownership-guarded (IDOR: T-03-06)
// ---------------------------------------------------------------------------

export async function getFixedAccounts(userId: string) {
  return prisma.fixedAccount.findMany({
    where: { userId },
    orderBy: { dueDay: 'asc' },
  })
}

export async function createFixedAccountService(
  data: FixedAccountFormData & { userId: string }
) {
  return prisma.fixedAccount.create({ data })
}

export async function updateFixedAccountService(
  id: string,
  userId: string,
  data: FixedAccountFormData
) {
  const record = await prisma.fixedAccount.findFirst({ where: { id, userId } })
  if (!record) throw new Error('Conta fixa não encontrada.')
  return prisma.fixedAccount.update({ where: { id }, data })
}

export async function deleteFixedAccountService(id: string, userId: string) {
  const record = await prisma.fixedAccount.findFirst({ where: { id, userId } })
  if (!record) throw new Error('Conta fixa não encontrada.')
  return prisma.fixedAccount.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// AnnualExpense CRUD (FIXA-02) — ownership-guarded (IDOR: T-03-06)
// ---------------------------------------------------------------------------

export async function getAnnualExpenses(userId: string) {
  return prisma.annualExpense.findMany({
    where: { userId },
    orderBy: { dueMonth: 'asc' },
  })
}

export async function createAnnualExpenseService(
  data: AnnualExpenseFormData & { userId: string }
) {
  return prisma.annualExpense.create({ data })
}

export async function updateAnnualExpenseService(
  id: string,
  userId: string,
  data: AnnualExpenseFormData
) {
  const record = await prisma.annualExpense.findFirst({ where: { id, userId } })
  if (!record) throw new Error('Gasto anual não encontrado.')
  return prisma.annualExpense.update({ where: { id }, data })
}

export async function deleteAnnualExpenseService(id: string, userId: string) {
  const record = await prisma.annualExpense.findFirst({ where: { id, userId } })
  if (!record) throw new Error('Gasto anual não encontrado.')
  return prisma.annualExpense.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// Goal CRUD + seed (META-01 / META-02) — ownership-guarded (IDOR: T-03-06)
// ---------------------------------------------------------------------------

/**
 * Metas semeadas no primeiro acesso (D-06 / META-02): APENAS por nome.
 * alvo/guardado zerados, prazo nulo para o usuário preencher.
 */
export const SEED_GOAL_NAMES = [
  'Reserva de emergência',
  'Caixinha do carro',
] as const

/**
 * Retorna as metas do usuário; se não houver nenhuma, semeia as duas metas
 * padrão (por nome somente) dentro de uma transação — idempotente, no mesmo
 * espírito de getOrCreateMonthlyBudget (visao-geral/service.ts).
 */
export async function getOrSeedGoals(userId: string) {
  const existing = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  if (existing.length > 0) return existing

  return prisma.$transaction(
    SEED_GOAL_NAMES.map((name) =>
      prisma.goal.create({
        data: { userId, name, targetCents: 0, savedCents: 0, deadline: null },
      })
    )
  )
}

export async function createGoalService(
  data: GoalFormData & { userId: string }
) {
  const { deadline, ...rest } = data
  return prisma.goal.create({
    data: { ...rest, deadline: deadline ?? null },
  })
}

export async function updateGoalService(
  id: string,
  userId: string,
  data: GoalFormData
) {
  const record = await prisma.goal.findFirst({ where: { id, userId } })
  if (!record) throw new Error('Meta não encontrada.')
  const { deadline, ...rest } = data
  return prisma.goal.update({
    where: { id },
    data: { ...rest, deadline: deadline ?? null },
  })
}

export async function deleteGoalService(id: string, userId: string) {
  const record = await prisma.goal.findFirst({ where: { id, userId } })
  if (!record) throw new Error('Meta não encontrada.')
  return prisma.goal.delete({ where: { id } })
}
