// src/app/(authed)/planejamento/page.tsx
// Server Component — no 'use client'.
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { loadPlanData } from './_lib/loader'
import { computePlanSummary, countWeeks } from './_lib/service'
import { PlanTable, type PlanTableItem, type FixedRow } from './_components/PlanTable'
import { ResumoPlano } from './_components/ResumoPlano'
import { CopyPlanButton } from './_components/CopyPlanButton'
import { WeeklyCardsSection } from './_components/WeeklyCardsSection'
import type { GroupSegment } from './_components/SegmentedBar'
import { groupColor } from './_components/groupColors'

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

/** "2026-11" → "CASA · NOVEMBRO 2026" */
function eyebrowLabel(month: string): string {
  const [year, monthNum] = month.split('-').map(Number)
  const d = new Date(year, monthNum - 1, 1)
  return `CASA · ${format(d, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}`
}

export default async function PlanejamentoPage({ searchParams }: PageProps) {
  const { month } = await searchParams

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user!.id

  const currentMonth = month ?? new Date().toISOString().slice(0, 7)

  const { planItems, budget, casaCategories, hasPreviousPlan, fixedRows, weeks } =
    await loadPlanData(userId, currentMonth)

  // Plan summary (totalPlanejado, folga, acima).
  const summary = computePlanSummary(planItems, budget.ceilingCents)

  // Per-grupo aggregation for the segmented bar + legend.
  const grupoTotals = new Map<string, number>()
  for (const item of planItems) {
    const total = item.valuePerCents * countWeeks(item)
    grupoTotals.set(
      item.category.name,
      (grupoTotals.get(item.category.name) ?? 0) + total
    )
  }
  const segments: GroupSegment[] = Array.from(grupoTotals.entries())
    .filter(([, totalCents]) => totalCents > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, totalCents]) => ({
      name,
      totalCents,
      color: groupColor(name),
    }))

  const tableItems: PlanTableItem[] = planItems.map((item) => ({
    id: item.id,
    name: item.name,
    categoryId: item.categoryId,
    valuePerCents: item.valuePerCents,
    week1: item.week1,
    week2: item.week2,
    week3: item.week3,
    week4: item.week4,
    category: { id: item.category.id, name: item.category.name },
  }))

  // Linhas derivadas (somente-leitura) do grupo "Contas fixas" — PLAN-06/D-05.
  const fixedTableRows: FixedRow[] = fixedRows.map((r) => ({
    id: r.id,
    name: r.name,
    valuePerCents: r.valuePerCents,
    nSemanas: r.nSemanas,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {eyebrowLabel(currentMonth)}
          </p>
          <h1 className="text-xl font-semibold text-text-primary">
            Planejamento do mês
          </h1>
        </div>
        <CopyPlanButton month={currentMonth} hasPreviousPlan={hasPreviousPlan} />
      </div>

      {/* Main row: table (left ~2/3) + resumo (right ~1/3) on desktop */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PlanTable
            items={tableItems}
            fixedRows={fixedTableRows}
            ceilingCents={budget.ceilingCents}
            month={currentMonth}
            categories={casaCategories}
          />
        </div>
        <div className="lg:col-span-1">
          <ResumoPlano
            month={currentMonth}
            ceilingCents={budget.ceilingCents}
            totalPlanejado={summary.totalPlanejado}
            folga={summary.folga}
            acima={summary.acima}
            segments={segments}
            hasItems={planItems.length > 0}
          />
        </div>
      </div>

      {/* Faixa full-width: "Gastos semanais" (03-UI-SPEC composição D) */}
      <WeeklyCardsSection weeks={weeks} month={currentMonth} />
    </div>
  )
}
