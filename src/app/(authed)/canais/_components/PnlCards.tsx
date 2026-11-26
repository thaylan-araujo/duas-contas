import { formatBRL } from '@/lib/format'

interface PnlCardsProps {
  /** Faturamento bruto = soma das receitas (ENTRADA) no mês (PNL-02). */
  brutoCents: number
  /** Faturamento líquido = bruto − impostos (PNL-03). */
  liquidoCents: number
  /** Lucro = receitas − todos os custos (SAIDA) do mês (PNL-04). */
  lucroCents: number
  /** DAS estimado do mês = alíquota × faturamento bruto (CONS-02 / D-03). */
  dasEstimadoCents: number
  /** Se a empresa tem alíquota definida — false → "não definido" (D-03). */
  aliquotaDefinida: boolean
}

/**
 * Quatro cards do P&L da empresa ativa — Faturamento bruto, Faturamento líquido,
 * Lucro e DAS estimado — no mesmo estilo de DashboardCards (rounded-2xl, bg-card,
 * font-mono, formatBRL). O lucro usa text-positive quando ≥ 0 e text-warning
 * quando negativo. O DAS estimado (D-03) mostra "não definido" quando a empresa
 * ainda não tem alíquota — nunca R$ 0,00 silencioso —, para o usuário saber que
 * precisa preencher a alíquota no cadastro da empresa.
 */
export function PnlCards({
  brutoCents,
  liquidoCents,
  lucroCents,
  dasEstimadoCents,
  aliquotaDefinida,
}: PnlCardsProps) {
  const lucroPositive = lucroCents >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Card 4 — DAS estimado = alíquota × faturamento bruto (CONS-02 / D-03).
          Sem alíquota definida → "não definido" (não R$ 0,00 silencioso). */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">DAS estimado</p>
        {aliquotaDefinida ? (
          <span className="text-2xl font-semibold font-mono text-text-primary">
            {formatBRL(dasEstimadoCents)}
          </span>
        ) : (
          <span className="text-2xl font-semibold font-mono text-text-secondary">
            não definido
          </span>
        )}
      </div>
    </div>
  )
}
