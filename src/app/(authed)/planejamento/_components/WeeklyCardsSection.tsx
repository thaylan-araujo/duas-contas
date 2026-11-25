// src/app/(authed)/planejamento/_components/WeeklyCardsSection.tsx
// Faixa full-width "Gastos semanais" (03-UI-SPEC §1.D): os 4 cartões semanais
// em grade. Mobile: coluna única. Desktop: 4 colunas (2×2 em larguras
// intermediárias).
import { WeekCard } from './WeekCard'
import type { WeekData } from '../_lib/loader'

interface WeeklyCardsSectionProps {
  weeks: WeekData[]
  month: string
}

export function WeeklyCardsSection({ weeks, month }: WeeklyCardsSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-text-primary">Gastos semanais</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {weeks.map((week) => (
          <WeekCard key={week.weekIndex} week={week} month={month} />
        ))}
      </div>
    </section>
  )
}
