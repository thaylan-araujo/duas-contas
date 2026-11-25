// src/app/(authed)/planejamento/_lib/loader.ts
// Server-side data loading — no 'use server' (called from the Server Component).
import { prisma } from '@/lib/prisma'
import { weekDateRange } from '@/lib/weeks'
import { getOrCreateMonthlyBudget } from '../../visao-geral/_lib/service'
import { getCategories } from '../../lancamentos/_lib/service'
import { getFixedAccounts } from '../../contas-fixas/_lib/service'
import {
  getOrCreatePlan,
  getPlanItemsWithCategory,
  getAutoGastei,
  getWeeklySpends,
  resolveGastei,
  computeWeekRemaining,
  fixedAccountsAsRows,
  type DerivedFixedRow,
} from './service'

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/

const WEEK_INDEXES: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3]

/** One tracked item inside a weekly card (D-01/D-02). */
export interface WeekItem {
  id: string
  name: string
  categoryId: string
  categoryName: string
  plannedCents: number
  autoGasteiCents: number
  manualCents: number | null
  gasteiCents: number
  sobraCents: number
}

/** One of the 4 weekly cards. */
export interface WeekData {
  weekIndex: 0 | 1 | 2 | 3
  label: string // "Semana 1"
  dayRange: string // "1 a 7 nov"
  isCurrent: boolean
  plannedCents: number
  gasteiCents: number
  sobraCents: number
  items: WeekItem[]
}

/** Which of the 4 week booleans is set for a given index. */
function weekFlag(
  item: { week1: boolean; week2: boolean; week3: boolean; week4: boolean },
  weekIndex: 0 | 1 | 2 | 3
): boolean {
  return [item.week1, item.week2, item.week3, item.week4][weekIndex]
}

/** "1 a 7 nov" from the week's date range. */
function formatDayRange(start: Date, end: Date): string {
  const monthShort = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(end)
    .replace('.', '')
  return `${start.getDate()} a ${end.getDate()} ${monthShort}`
}

/**
 * Orchestrates the /planejamento data fetches in parallel.
 *
 * Returns:
 * - planItems: items for the month, joined with their grupo (category)
 * - budget: MonthlyBudget (teto) — reused from Fase 2 (PLAN-01)
 * - casaCategories: Casa categories for the item Sheet's "Grupo" Select (D-03)
 * - hasPreviousPlan: whether a prior month has plan items (enables the copy button, PLAN-05)
 */
export async function loadPlanData(userId: string, month: string) {
  if (!monthRegex.test(month)) {
    throw new Error('Formato de mês inválido')
  }

  // getOrCreatePlan pre-fills the first month (D-04) — run it first so the
  // subsequent getPlanItemsWithCategory sees any just-created rows.
  await getOrCreatePlan(userId, month)

  const [budget, planItems, allCategories, prior, fixedAccounts, weeklySpends] =
    await Promise.all([
      getOrCreateMonthlyBudget(userId, month),
      getPlanItemsWithCategory(userId, month),
      getCategories(userId),
      prisma.planItem.findFirst({ where: { userId, month: { lt: month } } }),
      getFixedAccounts(userId),
      getWeeklySpends(userId, month),
    ])

  const casaCategories = allCategories.filter((c) => c.account === 'CASA')
  const hasPreviousPlan = prior !== null

  // Derived read-only "Contas fixas" rows (D-05/PLAN-06) — NOT persisted.
  const fixedRows: DerivedFixedRow[] = fixedAccountsAsRows(fixedAccounts)

  // Build the 4 weekly cards. For each week, the "Gastei R$" per item is the
  // auto sum of CASA SAIDA transactions of that category within the week range,
  // overridden by any persisted WeeklySpend (resolveGastei). The editor lives at
  // the category level, consistent with the WeeklySpend key.
  const [year, monthNum] = month.split('-').map(Number)
  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === monthNum
  const todayDay = today.getDate()

  const weeks: WeekData[] = await Promise.all(
    WEEK_INDEXES.map(async (weekIndex) => {
      const { start, end } = weekDateRange(month, weekIndex)
      const itemsThisWeek = planItems.filter((it) => weekFlag(it, weekIndex))

      // Auto "Gastei" is per category — compute once per distinct category.
      const categoryIds = Array.from(
        new Set(itemsThisWeek.map((it) => it.categoryId))
      )
      const autoByCategory = new Map<string, number>()
      await Promise.all(
        categoryIds.map(async (categoryId) => {
          autoByCategory.set(
            categoryId,
            await getAutoGastei(userId, month, weekIndex, categoryId)
          )
        })
      )

      const items: WeekItem[] = itemsThisWeek.map((it) => {
        const autoGasteiCents = autoByCategory.get(it.categoryId) ?? 0
        const manual = weeklySpends.get(`${weekIndex}:${it.categoryId}`)
        const manualCents = manual === undefined ? null : manual
        const gasteiCents = resolveGastei({ manualCents, autoCents: autoGasteiCents })
        return {
          id: it.id,
          name: it.name,
          categoryId: it.categoryId,
          categoryName: it.category.name,
          plannedCents: it.valuePerCents,
          autoGasteiCents,
          manualCents,
          gasteiCents,
          sobraCents: computeWeekRemaining(it.valuePerCents, gasteiCents),
        }
      })

      // Per-week totals. "Gastei" aggregates each distinct category once (the
      // editor + override are per category, not per item — avoids double count).
      const plannedCents = items.reduce((s, it) => s + it.plannedCents, 0)
      const gasteiByCategory = new Map<string, number>()
      for (const it of items) {
        if (!gasteiByCategory.has(it.categoryId)) {
          gasteiByCategory.set(it.categoryId, it.gasteiCents)
        }
      }
      const gasteiCents = Array.from(gasteiByCategory.values()).reduce(
        (s, v) => s + v,
        0
      )

      return {
        weekIndex,
        label: `Semana ${weekIndex + 1}`,
        dayRange: formatDayRange(start, end),
        isCurrent:
          isCurrentMonth && todayDay >= start.getDate() && todayDay <= end.getDate(),
        plannedCents,
        gasteiCents,
        sobraCents: computeWeekRemaining(plannedCents, gasteiCents),
        items,
      }
    })
  )

  return {
    planItems,
    budget,
    casaCategories,
    hasPreviousPlan,
    fixedRows,
    weeks,
  }
}
