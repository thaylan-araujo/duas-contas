// src/app/(authed)/planejamento/_components/ResumoPlano.tsx
// Card "Resumo do plano" (PLAN-01/PLAN-03): teto editável + Planejado + Folga
// + segmented bar + legend. Server-rendered; the only client piece is the
// InlineCeilingEditor (imported from the visao-geral slice).
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { InlineCeilingEditor } from '../../visao-geral/_components/InlineCeilingEditor'
import { SegmentedBar, type GroupSegment } from './SegmentedBar'
import { FOLGA_COLOR } from './groupColors'

interface ResumoPlanoProps {
  month: string
  ceilingCents: number
  totalPlanejado: number
  folga: number
  acima: boolean
  segments: GroupSegment[]
  hasItems: boolean
}

function pct(totalCents: number, ceilingCents: number): number {
  if (ceilingCents <= 0) return 0
  return Math.round((totalCents / ceilingCents) * 100)
}

export function ResumoPlano({
  month,
  ceilingCents,
  totalPlanejado,
  folga,
  acima,
  segments,
  hasItems,
}: ResumoPlanoProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-4 text-xl font-semibold text-text-primary">
        Resumo do plano
      </h2>

      {/* Teto de gastos do mês (PLAN-01) */}
      <div className="mb-4">
        <p className="text-sm text-text-secondary">Teto de gastos do mês</p>
        <InlineCeilingEditor initialCents={ceilingCents} month={month} />
      </div>

      {/* Planejado */}
      <div className="flex items-center justify-between py-2">
        <span className="text-base text-text-secondary">Planejado</span>
        <span className="font-mono text-xl font-semibold text-text-primary">
          {formatBRL(totalPlanejado)}
        </span>
      </div>

      {/* Folga */}
      <div className="flex items-center justify-between py-2">
        <span className="text-base text-text-secondary">Folga</span>
        <span
          className={cn(
            'font-mono text-xl font-semibold',
            acima ? 'text-warning' : 'text-positive'
          )}
        >
          {acima
            ? `Passou do teto em ${formatBRL(Math.abs(folga))}`
            : formatBRL(folga)}
        </span>
      </div>

      {!hasItems ? (
        <p className="mt-4 text-sm text-text-secondary">
          Nenhum item planejado para este mês.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <SegmentedBar
            segments={segments}
            folgaCents={folga}
            ceilingCents={ceilingCents}
          />

          {/* Legenda */}
          <ul className="space-y-1.5">
            {segments.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 text-base text-text-primary">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </span>
                <span className="font-mono text-sm text-text-secondary">
                  {formatBRL(s.totalCents)} · {pct(s.totalCents, ceilingCents)}%
                </span>
              </li>
            ))}
            {/* Folga line */}
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-base text-text-primary">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: FOLGA_COLOR }}
                />
                Folga
              </span>
              <span className="font-mono text-sm text-text-secondary">
                {formatBRL(Math.max(folga, 0))} ·{' '}
                {pct(Math.max(folga, 0), ceilingCents)}%
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
