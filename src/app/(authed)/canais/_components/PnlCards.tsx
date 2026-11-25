import { formatBRL } from '@/lib/format'

interface PnlCardsProps {
  /** Faturamento bruto = soma das receitas (ENTRADA) no mês (PNL-02). */
  brutoCents: number
  /** Faturamento líquido = bruto − impostos (PNL-03). */
  liquidoCents: number
  /** Lucro = receitas − todos os custos (SAIDA) do mês (PNL-04). */
  lucroCents: number
}

/**
 * Três cards do P&L da empresa ativa — Faturamento bruto, Faturamento líquido e
 * Lucro — no mesmo estilo de DashboardCards (rounded-2xl, bg-card, font-mono,
 * formatBRL). O lucro usa text-positive quando ≥ 0 e text-warning quando
 * negativo (mesmo tom que DashboardCards usa para o "Restante do mês").
 */
export function PnlCards({ brutoCents, liquidoCents, lucroCents }: PnlCardsProps) {
  const lucroPositive = lucroCents >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Card 1 — Faturamento bruto = soma das ENTRADAS da empresa no mês (PNL-02) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">
          Faturamento bruto
        </p>
        <span className="text-2xl font-semibold font-mono text-text-primary">
          {formatBRL(brutoCents)}
        </span>
      </div>

      {/* Card 2 — Faturamento líquido = bruto − impostos (PNL-03) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">
          Faturamento líquido
        </p>
        <span className="text-2xl font-semibold font-mono text-text-primary">
          {formatBRL(liquidoCents)}
        </span>
      </div>

      {/* Card 3 — Lucro = receitas − todos os custos (PNL-04) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">Lucro</p>
        {lucroPositive ? (
          <span className="text-2xl font-semibold font-mono text-positive">
            {formatBRL(lucroCents)}
          </span>
        ) : (
          <span className="text-2xl font-semibold font-mono text-warning">
            {`Prejuízo ${formatBRL(Math.abs(lucroCents))}`}
          </span>
        )}
      </div>
    </div>
  )
}
