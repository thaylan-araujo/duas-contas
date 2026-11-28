import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { loadDashboardData, loadRendaFamiliar } from './_lib/loader'
import { DashboardCards } from './_components/DashboardCards'
import { HeroPossoGastar } from './_components/HeroPossoGastar'
import { ContasFixasBloco } from './_components/ContasFixasBloco'
import { CategorySpendingBars } from './_components/CategorySpendingBars'
import { WeeklyBarChart } from './_components/WeeklyBarChart'
import { RendaFamiliarPorOrigem } from './_components/RendaFamiliarPorOrigem'
import type { LinhaRendaPorOrigem } from './_lib/renda-familiar'
// C6 — bloco "variável da semana com teto" (Fase 3.5) REUSADO INALTERADO.
import { loadAcompanhamentoData } from '@/app/(authed)/planejamento/_lib/loader'
import { CategoriaTetoList } from '@/app/(authed)/planejamento/_components/CategoriaTetoList'
import { GastoSemanalAuto } from '@/app/(authed)/planejamento/_components/GastoSemanalAuto'
import type { AcompanhamentoData } from '@/app/(authed)/planejamento/_lib/loader'

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

  // Preserva o contexto de mês/empresa nos atalhos para a aba de edição em
  // Lançamentos (links de navegação — permitidos na Visão Geral, UI-SPEC).
  const contextParams = new URLSearchParams()
  if (month) contextParams.set('month', month)
  if (empresaId) contextParams.set('empresaId', empresaId)
  const contextSuffix = contextParams.toString()
    ? `&${contextParams.toString()}`
    : ''
  const editarContasFixasHref = `/lancamentos?aba=contas-fixas${contextSuffix}`
  const editarTetosHref = `/lancamentos?aba=tetos${contextSuffix}`

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
      contasFixasLinhas,
      temFixasCadastradas,
    },
    rendaFamiliar,
    acompanhamento,
  ] = await Promise.all([
    loadDashboardData(userId, currentMonth, empresaIdContexto),
    isCasa
      ? loadRendaFamiliar(userId, currentMonth)
      : Promise.resolve<LinhaRendaPorOrigem[]>([]),
    // C6: dados do bloco "variável da semana com teto" (Fase 3.5) — só na Casa.
    isCasa
      ? loadAcompanhamentoData(userId, currentMonth)
      : Promise.resolve<AcompanhamentoData | null>(null),
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

      {/* Bloco "Contas fixas" (10-02) — logo após o hero, só na Casa.
          Modo leitura (readOnly): sem botões de ação; a edição fica em Lançamentos. */}
      {isCasa && (
        <div className="flex flex-col gap-2">
          <ContasFixasBloco
            month={currentMonth}
            linhas={contasFixasLinhas}
            temFixasCadastradas={temFixasCadastradas}
            readOnly
          />
          <Link
            href={editarContasFixasHref}
            className="inline-flex min-h-[44px] items-center self-start text-sm font-medium text-casa underline-offset-2 hover:underline"
          >
            Editar/gerir contas fixas
          </Link>
        </div>
      )}

      {/* C6 — bloco "variável da semana com teto" (Fase 3.5) REUSADO inalterado,
          junto do hero + contas-fixas. Conta só o PAGO (R-1). */}
      {isCasa && acompanhamento && (
        <>
          <div className="flex flex-col gap-2">
            <CategoriaTetoList
              month={currentMonth}
              categorias={acompanhamento.categorias}
              readOnly
            />
            <Link
              href={editarTetosHref}
              className="inline-flex min-h-[44px] items-center self-start text-sm font-medium text-casa underline-offset-2 hover:underline"
            >
              Editar tetos
            </Link>
          </div>
          <GastoSemanalAuto semanas={acompanhamento.semanas} />
        </>
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
