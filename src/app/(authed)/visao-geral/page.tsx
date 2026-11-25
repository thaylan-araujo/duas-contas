import { createSupabaseServerClient } from '@/lib/supabase/server'
import { loadDashboardData } from './_lib/loader'
import { AccountSelector } from './_components/AccountSelector'
import { DashboardCards } from './_components/DashboardCards'
import { CategorySpendingBars } from './_components/CategorySpendingBars'
import { WeeklyBarChart } from './_components/WeeklyBarChart'

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function VisaoGeralPage({ searchParams }: PageProps) {
  const { month } = await searchParams

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userId = user!.id
  const currentMonth = month ?? new Date().toISOString().slice(0, 7)

  const { budget, totalSpentCents, categorySpending, weeklySpending, planTotalCents } =
    await loadDashboardData(userId, currentMonth)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Visão Geral</h1>
        <AccountSelector />
      </div>

      <DashboardCards
        budget={budget}
        totalSpentCents={totalSpentCents}
        planTotalCents={planTotalCents}
        month={currentMonth}
      />

      <CategorySpendingBars categorySpending={categorySpending} />

      <WeeklyBarChart data={weeklySpending} />
    </div>
  )
}
