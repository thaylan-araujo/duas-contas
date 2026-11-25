// src/app/(authed)/planejamento/_lib/service.ts
// Business logic — pure calc functions (testable, no Prisma) + Prisma access.
// No 'use server' here (this is a plain module).
import { prisma } from '@/lib/prisma'
import type { PlanItemFormData } from './schema'

// ---------------------------------------------------------------------------
// Pure calc functions (no Prisma — maximally testable, 03-RESEARCH §Validation)
// ---------------------------------------------------------------------------

/** The 4 week booleans of a plan item (D-01). */
export interface PlanWeeks {
  week1: boolean
  week2: boolean
  week3: boolean
  week4: boolean
}

/** A row that contributes to the plan total: a per-time value + its weeks. */
export interface PlanRow extends PlanWeeks {
  valuePerCents: number
}

/**
 * Number of weeks an item recurs = how many of the 4 weeks are marked (D-01).
 * countWeeks({week1:true, week2:false, week3:true, week4:true}) → 3
 */
export function countWeeks(item: PlanWeeks): number {
  return [item.week1, item.week2, item.week3, item.week4].filter(Boolean).length
}

/**
 * Plan summary (spec §Cálculos):
 * - totalPlanejado = Σ valuePerCents × countWeeks(row)  (item total = valor × nº semanas, D-01)
 * - folga          = ceilingCents − totalPlanejado
 * - acima          = folga < 0  → "Passou do teto em R$ X"
 */
export function computePlanSummary(
  rows: PlanRow[],
  ceilingCents: number
): { totalPlanejado: number; folga: number; acima: boolean } {
  const totalPlanejado = rows.reduce(
    (sum, r) => sum + r.valuePerCents * countWeeks(r),
    0
  )
  const folga = ceilingCents - totalPlanejado
  return { totalPlanejado, folga, acima: folga < 0 }
}

// ---------------------------------------------------------------------------
// First-month routine (D-04). Grupo = seeded Casa category name (D-03).
// ---------------------------------------------------------------------------

/**
 * Spec routine for the very first month, before any plan/history exists (D-04).
 * categoryName is resolved to the user's Casa category id at create time.
 */
interface RoutineItem {
  name: string
  categoryName: string
  valuePerCents: number
  week1: boolean
  week2: boolean
  week3: boolean
  week4: boolean
}

export const SPEC_ROUTINE_ITEMS: RoutineItem[] = [
  // Compra do mês R$ 1.000 ×1 (semana 1)
  {
    name: 'Compra do mês',
    categoryName: 'Alimentação',
    valuePerCents: 100_000,
    week1: true,
    week2: false,
    week3: false,
    week4: false,
  },
  // Mercado semanal R$ 250 ×3 (semanas 2–4)
  {
    name: 'Mercado semanal',
    categoryName: 'Alimentação',
    valuePerCents: 25_000,
    week1: false,
    week2: true,
    week3: true,
    week4: true,
  },
  // Combustível R$ 100 ×4 (semanas 1–4)
  {
    name: 'Combustível',
    categoryName: 'Combustível',
    valuePerCents: 10_000,
    week1: true,
    week2: true,
    week3: true,
    week4: true,
  },
  // Lazer R$ 150 ×4 (semanas 1–4)
  {
    name: 'Lazer de sábado',
    categoryName: 'Lazer',
    valuePerCents: 15_000,
    week1: true,
    week2: true,
    week3: true,
    week4: true,
  },
  // Outros R$ 0 (semana 1)
  {
    name: 'Outros',
    categoryName: 'Outros',
    valuePerCents: 0,
    week1: true,
    week2: false,
    week3: false,
    week4: false,
  },
]

// ---------------------------------------------------------------------------
// Prisma access functions
// ---------------------------------------------------------------------------

/**
 * Idempotent get-or-create of the month's plan items (D-04):
 * - If this month already has items → return them.
 * - Else if any PRIOR month has items → return [] (later months start empty;
 *   the user brings them over via "Copiar plano do mês anterior" — D-04).
 * - Else (first month, no history) → pre-fill the spec routine inside a
 *   $transaction, resolving each item's grupo to the user's Casa category.
 */
export async function getOrCreatePlan(userId: string, month: string) {
  const existing = await prisma.planItem.findMany({
    where: { userId, month },
    orderBy: { createdAt: 'asc' },
  })
  if (existing.length > 0) return existing

  // Any prior month with plan items? Then this month starts empty (D-04).
  const anyPrior = await prisma.planItem.findFirst({
    where: { userId, month: { lt: month } },
  })
  if (anyPrior) return []

  // First month, no history → pre-fill the spec routine (D-04).
  // Resolve each routine item's grupo to the user's seeded Casa category.
  const casaCategories = await prisma.category.findMany({
    where: { userId, account: 'CASA' },
    select: { id: true, name: true },
  })
  const idByName = new Map(casaCategories.map((c) => [c.name, c.id]))

  const toCreate = SPEC_ROUTINE_ITEMS.map((item) => {
    const categoryId = idByName.get(item.categoryName)
    return categoryId
      ? {
          userId,
          month,
          name: item.name,
          categoryId,
          valuePerCents: item.valuePerCents,
          week1: item.week1,
          week2: item.week2,
          week3: item.week3,
          week4: item.week4,
        }
      : null
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  // No Casa categories resolved (unusual) → nothing to pre-fill.
  if (toCreate.length === 0) return []

  await prisma.$transaction(
    toCreate.map((data) => prisma.planItem.create({ data }))
  )

  return prisma.planItem.findMany({
    where: { userId, month },
    orderBy: { createdAt: 'asc' },
  })
}

/** Plan items for a month, joined with their category (grupo). */
export async function getPlanItemsWithCategory(userId: string, month: string) {
  return prisma.planItem.findMany({
    where: { userId, month },
    include: { category: true },
    orderBy: { createdAt: 'asc' },
  })
}

/** Creates a plan item for the user+month. */
export async function createPlanItemService(
  data: PlanItemFormData & { userId: string; month: string }
) {
  const { userId, month, ...rest } = data
  return prisma.planItem.create({
    data: { ...rest, userId, month },
  })
}

/**
 * Updates a plan item. IDOR guard (T-03-02): ownership checked via
 * findFirst({ id, userId }) before the update.
 */
export async function updatePlanItemService(
  id: string,
  userId: string,
  data: PlanItemFormData
) {
  const record = await prisma.planItem.findFirst({ where: { id, userId } })
  if (!record) {
    throw new Error('Item não encontrado.')
  }
  return prisma.planItem.update({
    where: { id },
    data,
  })
}

/**
 * Deletes a plan item. IDOR guard (T-03-02): ownership checked via
 * findFirst({ id, userId }) before the delete.
 */
export async function deletePlanItemService(id: string, userId: string) {
  const record = await prisma.planItem.findFirst({ where: { id, userId } })
  if (!record) {
    throw new Error('Item não encontrado.')
  }
  return prisma.planItem.delete({ where: { id } })
}

/**
 * Copies the most recent prior month's plan items into `month` (PLAN-05, D-04).
 * Copies only persisted PlanItems (not derived fixed-account rows — 03-RESEARCH A5),
 * atomically inside a $transaction.
 */
export async function copyPlanFromPreviousMonth(userId: string, month: string) {
  // Find the most recent prior month that has plan items.
  const mostRecentPrior = await prisma.planItem.findFirst({
    where: { userId, month: { lt: month } },
    orderBy: { month: 'desc' },
    select: { month: true },
  })
  if (!mostRecentPrior) return []

  const priorItems = await prisma.planItem.findMany({
    where: { userId, month: mostRecentPrior.month },
    orderBy: { createdAt: 'asc' },
  })
  if (priorItems.length === 0) return []

  return prisma.$transaction(
    priorItems.map((item) =>
      prisma.planItem.create({
        data: {
          userId,
          month,
          name: item.name,
          categoryId: item.categoryId,
          valuePerCents: item.valuePerCents,
          week1: item.week1,
          week2: item.week2,
          week3: item.week3,
          week4: item.week4,
        },
      })
    )
  )
}
