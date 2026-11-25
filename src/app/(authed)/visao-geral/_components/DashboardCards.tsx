import { type MonthlyBudget } from '@prisma/client'
import { formatBRL } from '@/lib/format'
import { InlineCeilingEditor } from './InlineCeilingEditor'

interface DashboardCardsProps {
  budget: MonthlyBudget
  totalSpentCents: number
  restanteCents: number
  month: string
  /**
   * true quando o contexto ativo é uma empresa. Empresas não têm "dinheiro do
   * mês"/teto (o MonthlyBudget é da Casa) — nesse caso ocultamos os cards
   * "Dinheiro do mês" e "Restante do mês" e mostramos só "Gasto até hoje"
   * (03b-03/D-06; T-03b-22 — lógica de empresa inalterada).
   */
  isEmpresa?: boolean
}

export function DashboardCards({
  budget,
  totalSpentCents,
  restanteCents,
  month,
  isEmpresa = false,
}: DashboardCardsProps) {
  // Contexto de empresa: sem dinheiro do mês/restante — só "Gasto até hoje".
  if (isEmpresa) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
          <p className="text-sm text-text-secondary font-sans mb-2">
            Gasto até hoje
          </p>
          <span className="text-2xl font-semibold font-mono text-text-primary">
            {formatBRL(totalSpentCents)}
          </span>
        </div>
      </div>
    )
  }

  // Restante do mês = dinheiro do mês − despesas (pode ser negativo).
  const restantePositive = restanteCents >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Card 1 — Dinheiro do mês (editável inline, MonthlyBudget.ceilingCents — D-02/CASA-R-01) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">
          Dinheiro do mês
        </p>
        <InlineCeilingEditor initialCents={budget.ceilingCents} month={month} />
      </div>

      {/* Card 2 — Restante do mês = dinheiro do mês − despesas da Casa no mês (D-06) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">
          Restante do mês
        </p>
        {restantePositive ? (
          <span className="text-2xl font-semibold font-mono text-positive">
            {formatBRL(restanteCents)}
          </span>
        ) : (
          <span className="text-2xl font-semibold font-mono text-warning">
            {`Passou ${formatBRL(Math.abs(restanteCents))}`}
          </span>
        )}
      </div>

      {/* Card 3 — Gasto até hoje */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">
          Gasto até hoje
        </p>
        <span className="text-2xl font-semibold font-mono text-text-primary">
          {formatBRL(totalSpentCents)}
        </span>
      </div>
    </div>
  )
}
