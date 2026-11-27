import { createSupabaseServerClient } from '@/lib/supabase/server'
import { loadDashboardData, loadRendaFamiliar } from './_lib/loader'
import { DashboardCards } from './_components/DashboardCards'
import { HeroPossoGastar } from './_components/HeroPossoGastar'
import { CategorySpendingBars } from './_components/CategorySpendingBars'
import { WeeklyBarChart } from './_components/WeeklyBarChart'
import { RendaFamiliarPorOrigem } from './_components/RendaFamiliarPorOrigem'
import type { LinhaRendaPorOrigem } from './_lib/renda-familiar'

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

  const isCasa = empresaIdContexto === null

  // A renda familiar por origem é um conceito da Casa (D-04): só carrega e só
  // renderiza no contexto Casa; no contexto de empresa a Visão Geral mostra o
  // acompanhamento da empresa (isEmpresa nos DashboardCards), não a renda.
  const [
    {
      dinheiroMesCents,
      totalSpentCents,
      restanteCents,
      categorySpending,
      weeklySpending,
      comprometidoCents,
      possoGastarCents,
      contasFixasCents,
      variavelCents,
      jaPagoCents,
    },
    rendaFamiliar,
  ] = await Promise.all([
    loadDashboardData(userId, currentMonth, empresaIdContexto),
    isCasa
      ? loadRendaFamiliar(userId, currentMonth)
      : Promise.resolve<LinhaRendaPorOrigem[]>([]),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-text-primary">Visão Geral</h1>
      </div>

      {isCasa && (
        <HeroPossoGastar
          possoGastarCents={possoGastarCents}
          comprometidoCents={comprometidoCents}
          dinheiroMesCents={dinheiroMesCents}
          contasFixasCents={contasFixasCents}
          variavelCents={variavelCents}
          jaPagoCents={jaPagoCents}
        />
      )}

      <DashboardCards
        dinheiroMesCents={dinheiroMesCents}
        totalSpentCents={totalSpentCents}
        restanteCents={restanteCents}
        isEmpresa={empresaIdContexto !== null}
      />

      {isCasa && <RendaFamiliarPorOrigem linhas={rendaFamiliar} />}

      <CategorySpendingBars categorySpending={categorySpending} />

      <WeeklyBarChart data={weeklySpending} />
    </div>
  )
}
