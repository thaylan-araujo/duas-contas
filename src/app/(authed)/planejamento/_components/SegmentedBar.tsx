// src/app/(authed)/planejamento/_components/SegmentedBar.tsx
// Single multi-segment bar by grupo + a trailing Folga segment (PLAN-03).
// role="img" + aria-label; the colored dot is aria-hidden and the textual
// legend (in ResumoPlano) is the accessible equivalent (03-UI-SPEC a11y).
import { formatBRL } from '@/lib/format'
import { FOLGA_COLOR } from './groupColors'

export interface GroupSegment {
  name: string
  totalCents: number
  color: string
}

interface SegmentedBarProps {
  segments: GroupSegment[]
  folgaCents: number
  ceilingCents: number
}

export function SegmentedBar({
  segments,
  folgaCents,
  ceilingCents,
}: SegmentedBarProps) {
  // Percentages are relative to the ceiling. When the plan is over the ceiling,
  // folga is negative → clamp to 0 so the bar still renders fully.
  const safeCeiling = ceilingCents > 0 ? ceilingCents : 1
  const folgaWidth = folgaCents > 0 ? (folgaCents / safeCeiling) * 100 : 0

  const ariaLabel =
    segments
      .map((s) => `${s.name} ${formatBRL(s.totalCents)}`)
      .join(', ') + `, Folga ${formatBRL(Math.max(folgaCents, 0))}`

  return (
    <div
      role="img"
      aria-label={`Divisão do teto por grupo: ${ariaLabel}`}
      className="flex h-3 w-full overflow-hidden rounded-full bg-border"
    >
      {segments.map((s) => (
        <div
          key={s.name}
          style={{
            width: `${(s.totalCents / safeCeiling) * 100}%`,
            backgroundColor: s.color,
          }}
          className="h-full"
        />
      ))}
      {folgaWidth > 0 && (
        <div
          style={{ width: `${folgaWidth}%`, backgroundColor: FOLGA_COLOR }}
          className="h-full"
        />
      )}
    </div>
  )
}
