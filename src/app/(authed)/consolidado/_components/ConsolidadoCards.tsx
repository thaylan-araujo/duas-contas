import { formatBRL } from '@/lib/format'
import type { TotaisConsolidado } from '../_lib/consolidado'

interface ConsolidadoCardsProps {
  totais: TotaisConsolidado
}

/**
 * Cards de topo da tela Consolidado (Fatia 4 — CONS-01/D-02): os totais SOMADOS
 * de todas as empresas do usuário no mês — Faturamento bruto, Faturamento
 * líquido, Lucro, DAS estimado total e Pró-labore total (→ renda familiar).
 * Mesmo estilo de PnlCards (rounded-2xl, bg-card, font-mono, formatBRL). O lucro
 * usa text-positive quando ≥ 0 e text-warning (Prejuízo) quando negativo.
 */
export function ConsolidadoCards({ totais }: ConsolidadoCardsProps) {
  const lucroPositive = totais.lucroCents >= 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Faturamento bruto total — soma do bruto de todas as empresas (PNL-02) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">
          Faturamento bruto
        </p>
        <span className="text-2xl font-semibold font-mono text-text-primary">
          {formatBRL(totais.brutoCents)}
        </span>
      </div>

      {/* Faturamento líquido total (PNL-03) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">
          Faturamento líquido
        </p>
        <span className="text-2xl font-semibold font-mono text-text-primary">
          {formatBRL(totais.liquidoCents)}
        </span>
      </div>

      {/* Lucro total (PNL-04) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">Lucro</p>
        {lucroPositive ? (
          <span className="text-2xl font-semibold font-mono text-positive">
            {formatBRL(totais.lucroCents)}
          </span>
        ) : (
          <span className="text-2xl font-semibold font-mono text-warning">
            {`Prejuízo ${formatBRL(Math.abs(totais.lucroCents))}`}
          </span>
        )}
      </div>

      {/* DAS estimado total — soma do DAS estimado de cada empresa (CONS-02/D-03) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">
          DAS estimado
        </p>
        <span className="text-2xl font-semibold font-mono text-text-primary">
          {formatBRL(totais.dasEstimadoCents)}
        </span>
      </div>

      {/* Pró-labore total — é o que vira renda familiar na Casa (04c) */}
      <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
        <p className="text-sm text-text-secondary font-sans mb-2">
          Pró-labore (renda familiar)
        </p>
        <span className="text-2xl font-semibold font-mono text-text-primary">
          {formatBRL(totais.proLaboreCents)}
        </span>
      </div>
    </div>
  )
}
