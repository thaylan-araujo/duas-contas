// src/app/(authed)/planejamento/_components/GastoSemanalAuto.tsx
// Server Component — "Gastos por semana" automático (D-04/CASA-R-03). Renderiza
// as 4 semanas (1–7 / 8–14 / 15–21 / 22–fim) com o total por categoria, somado
// dos lançamentos reais. Zero digitação — deixa isso claro na UI.
import { formatBRL } from '@/lib/format'
import type { SemanaCategoria } from '../_lib/acompanhamento'

interface GastoSemanalAutoProps {
  semanas: SemanaCategoria[]
}

export function GastoSemanalAuto({ semanas }: GastoSemanalAutoProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-text-primary">
        Gastos por semana
      </h2>
      <p className="mb-4 text-xs font-sans text-text-secondary">
        Automático — somado dos seus lançamentos. Nada para digitar.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {semanas.map((semana) => {
          const totalSemana = semana.categorias.reduce(
            (sum, c) => sum + c.totalCents,
            0
          )
          return (
            <div
              key={semana.weekIndex}
              className="flex flex-col gap-2 rounded-xl border border-border p-4"
            >
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {`${semana.label} (${semana.dayRange.startDay}–${semana.dayRange.endDay})`}
                </p>
                <p className="font-mono text-xs text-text-secondary">
                  {formatBRL(totalSemana)}
                </p>
              </div>

              {semana.categorias.length === 0 ? (
                <p className="text-xs font-sans text-text-secondary">
                  Sem gastos nesta semana.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {semana.categorias.map((cat) => (
                    <li
                      key={cat.categoryId}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="text-text-primary">{cat.categoryName}</span>
                      <span className="font-mono text-text-secondary">
                        {formatBRL(cat.totalCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
