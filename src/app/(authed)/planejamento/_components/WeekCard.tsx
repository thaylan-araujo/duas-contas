// src/app/(authed)/planejamento/_components/WeekCard.tsx
// Um cartão semanal (03-UI-SPEC §1.D): cabeçalho "Semana N" + faixa de dias,
// strip "Planejado"/"Ainda pode gastar", e a lista de itens da semana. O editor
// "Gastei R$" é renderizado UMA VEZ por categoria (chave do WeeklySpend:
// userId, month, weekIndex, categoryId — D-02), não duplicado por item.
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'
import { groupColor } from './groupColors'
import { InlineGasteiEditor } from './InlineGasteiEditor'
import type { WeekData, WeekItem } from '../_lib/loader'

interface WeekCardProps {
  week: WeekData
  month: string
}

/** Agrupa os itens da semana por categoria (o editor Gastei é por categoria). */
interface CategoryGroup {
  categoryId: string
  categoryName: string
  autoGasteiCents: number
  manualCents: number | null
  gasteiCents: number
  items: WeekItem[]
}

function groupByCategory(items: WeekItem[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>()
  for (const it of items) {
    const existing = map.get(it.categoryId)
    if (existing) {
      existing.items.push(it)
    } else {
      map.set(it.categoryId, {
        categoryId: it.categoryId,
        categoryName: it.categoryName,
        autoGasteiCents: it.autoGasteiCents,
        manualCents: it.manualCents,
        gasteiCents: it.gasteiCents,
        items: [it],
      })
    }
  }
  return Array.from(map.values())
}

function Sobra({ cents }: { cents: number }) {
  return (
    <span
      className={cn(
        'font-mono text-sm',
        cents >= 0 ? 'text-positive' : 'text-warning'
      )}
    >
      sobra {formatBRL(cents)}
    </span>
  )
}

export function WeekCard({ week, month }: WeekCardProps) {
  const groups = groupByCategory(week.items)
  const sobraPositive = week.sobraCents >= 0

  return (
    <div
      className="flex flex-col rounded-2xl border border-border bg-card p-4"
      aria-current={week.isCurrent ? 'true' : undefined}
    >
      {/* Cabeçalho */}
      <div
        className={cn(
          '-mx-4 -mt-4 mb-3 flex items-baseline justify-between gap-2 rounded-t-2xl px-4 pt-4 pb-3',
          week.isCurrent && 'bg-casa-light'
        )}
      >
        <h3
          className={cn(
            'text-xl font-semibold',
            week.isCurrent ? 'text-casa' : 'text-text-primary'
          )}
        >
          {week.label}
        </h3>
        <span className="text-sm text-text-secondary">{week.dayRange}</span>
      </div>

      {/* Strip de resumo */}
      <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-bg p-3">
        <div className="flex flex-col">
          <span className="text-xs text-text-secondary">Planejado</span>
          <span className="font-mono text-base font-semibold text-text-primary">
            {formatBRL(week.plannedCents)}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-xs text-text-secondary">Ainda pode gastar</span>
          <span
            className={cn(
              'font-mono text-base font-semibold',
              sobraPositive ? 'text-positive' : 'text-warning'
            )}
          >
            {formatBRL(week.sobraCents)}
          </span>
        </div>
      </div>

      {/* Lista de itens, agrupados por categoria */}
      {groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-secondary">
          Nada planejado nesta semana.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {groups.map((group) => (
            <li key={group.categoryId} className="flex flex-col gap-2 py-3">
              {/* Itens da categoria: nome + plano R$ + sobra R$ por item */}
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: groupColor(item.categoryName) }}
                    />
                    {item.name}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-sm text-text-secondary">
                      plano {formatBRL(item.plannedCents)}
                    </span>
                    <Sobra cents={item.sobraCents} />
                  </span>
                </div>
              ))}

              {/* Editor "Gastei R$" — uma vez por categoria (D-02) */}
              <InlineGasteiEditor
                month={month}
                weekIndex={week.weekIndex}
                categoryId={group.categoryId}
                autoGasteiCents={group.autoGasteiCents}
                manualCents={group.manualCents}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
