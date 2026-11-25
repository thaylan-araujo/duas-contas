// src/app/(authed)/planejamento/page.tsx
// Server Component — acompanhamento da Casa (D-02/D-03/D-04). Barra "Dinheiro do
// mês" + tetos por categoria (referência) + gasto semanal automático. Substitui
// o antigo planejamento semanal manual (removido em 03b-02, D-05).
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { loadAcompanhamentoData } from './_lib/loader'
import { MesBar } from './_components/MesBar'
import { CategoriaTetoList } from './_components/CategoriaTetoList'
import { GastoSemanalAuto } from './_components/GastoSemanalAuto'

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

  const { dinheiroMesCents, despesasMesCents, restanteCents, categorias, semanas } =
    await loadAcompanhamentoData(userId, currentMonth)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {eyebrowLabel(currentMonth)}
          </p>
          <h1 className="text-xl font-semibold text-text-primary">
            Acompanhamento do mês
          </h1>
        </div>
      </div>

      {/* Barra "Dinheiro do mês" (D-02) */}
      <MesBar
        month={currentMonth}
        dinheiroMesCents={dinheiroMesCents}
        despesasMesCents={despesasMesCents}
        restanteCents={restanteCents}
      />

      {/* Tetos por categoria (D-03) */}
      <CategoriaTetoList month={currentMonth} categorias={categorias} />

      {/* Gasto semanal automático por categoria (D-04) */}
      <GastoSemanalAuto semanas={semanas} />
    </div>
  )
}
