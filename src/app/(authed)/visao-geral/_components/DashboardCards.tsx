import { formatBRL } from '@/lib/format'

interface DashboardCardsProps {
  /**
   * "Dinheiro do mês" = soma automática das ENTRADAS da Casa no mês (D-06).
   * Valor calculado dos lançamentos, não editável.
   */
  dinheiroMesCents: number
  totalSpentCents: number
  restanteCents: number
  /**
   * true quando o contexto ativo é uma empresa. Empresas usam o mesmo cálculo
   * de entradas/despesas, mas aqui o dashboard de acompanhamento é da Casa —
   * nesse caso mostramos só "Gasto até hoje" (03b-03/D-06; T-03b-22 — lógica de
   * empresa inalterada).
   */
  isEmpresa?: boolean
}

export function DashboardCards({
  dinheiroMesCents,
  totalSpentCents,
  restanteCents,
  isEmpresa = false,
}: DashboardCardsProps) {
  // Contexto de empresa: dashboard de acompanhamento é da Casa — só "Gasto até hoje".
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
      {/* Card 1 — Dinheiro do mês = soma das ENTRADAS da Casa no mês (calculado, não editável — D-06) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">
          Dinheiro do mês
        </p>
        <span className="text-2xl font-semibold font-mono text-text-primary">
          {formatBRL(dinheiroMesCents)}
        </span>
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
