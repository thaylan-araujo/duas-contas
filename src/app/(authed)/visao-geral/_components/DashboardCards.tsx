import { type MonthlyBudget } from '@prisma/client'
import { formatBRL } from '@/lib/format'
import { InlineCeilingEditor } from './InlineCeilingEditor'

interface DashboardCardsProps {
  budget: MonthlyBudget
  totalSpentCents: number
  folgaCents: number
  month: string
}

export function DashboardCards({
  budget,
  totalSpentCents,
  folgaCents,
  month,
}: DashboardCardsProps) {
  const folgaPositive = folgaCents >= 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1 — Teto do mês (editable inline) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">Teto do mês</p>
        <InlineCeilingEditor initialCents={budget.ceilingCents} month={month} />
      </div>

      {/* Card 2 — Planejado (D-02 — Fase 3 implements ItemPlano) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">Planejado</p>
        <span className="text-2xl font-semibold font-mono text-text-primary">--</span>
      </div>

      {/* Card 3 — Folga */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">Folga</p>
        {folgaPositive ? (
          <span className="text-2xl font-semibold font-mono text-positive">
            {formatBRL(folgaCents)}
          </span>
        ) : (
          <span className="text-2xl font-semibold font-mono text-warning">
            {`Passou ${formatBRL(Math.abs(folgaCents))}`}
          </span>
        )}
      </div>

      {/* Card 4 — Gasto hoje */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">Gasto hoje</p>
        <span className="text-2xl font-semibold font-mono text-text-primary">
          {formatBRL(totalSpentCents)}
        </span>
      </div>
    </div>
  )
}
