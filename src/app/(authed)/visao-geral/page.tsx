import { createSupabaseServerClient } from '@/lib/supabase/server'
import { loadDashboardData } from './_lib/loader'
import { DashboardCards } from './_components/DashboardCards'
import { CategorySpendingBars } from './_components/CategorySpendingBars'
import { WeeklyBarChart } from './_components/WeeklyBarChart'

interface PageProps {
  searchParams: Promise<{ month?: string; empresaId?: string }>
}

export default async function VisaoGeralPage({ searchParams }: PageProps) {
  const { month, empresaId } = await searchParams

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user!.id
  const currentMonth = month ?? new Date().toISOString().slice(0, 7)

  // Contexto ativo do ContaSelector global: Casa (null) ou empresa (id). EMPF-06.
  const empresaIdContexto: string | null = empresaId ?? null

  const {
    dinheiroMesCents,
    totalSpentCents,
    restanteCents,
    categorySpending,
    weeklySpending,
  } = await loadDashboardData(userId, currentMonth, empresaIdContexto)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Visão Geral</h1>
      </div>

      <DashboardCards
        dinheiroMesCents={dinheiroMesCents}
        totalSpentCents={totalSpentCents}
        restanteCents={restanteCents}
        isEmpresa={empresaIdContexto !== null}
      />

      <CategorySpendingBars categorySpending={categorySpending} />

      <WeeklyBarChart data={weeklySpending} />
    </div>
  )
}
