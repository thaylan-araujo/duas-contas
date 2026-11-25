// src/app/(authed)/planejamento/_components/CategoriaTetoList.tsx
// Server Component — categorias da Casa com o gasto do mês vs. teto (D-03/CASA-R-02).
// Com teto: "gastei X de Y" + barra de progresso (passar de 100% destaca, mas
// NUNCA bloqueia — é só referência). Sem teto: só o total gasto. Cada linha tem
// o editor inline do teto. Já vem ordenada por gasto desc do loader.
import { formatBRL } from '@/lib/format'
import { InlineCategoriaTetoEditor } from './InlineCategoriaTetoEditor'
import type { CategoriaAcompanhamento } from '../_lib/loader'

interface CategoriaTetoListProps {
  month: string
  categorias: CategoriaAcompanhamento[]
}

export function CategoriaTetoList({ month, categorias }: CategoriaTetoListProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-text-primary">
        Por categoria
      </h2>
      <p className="mb-4 text-xs font-sans text-text-secondary">
        Teto mensal é referência — nunca bloqueia um lançamento.
      </p>

      {categorias.length === 0 ? (
        <p className="py-4 text-sm font-sans text-text-secondary">
          Nenhuma despesa da Casa neste mês ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {categorias.map((cat) => {
            const { status } = cat
            const estourou =
              status.temTeto &&
              status.restanteCents !== null &&
              status.restanteCents < 0

            return (
              <li key={cat.categoryId} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    {cat.name}
                  </span>
                  <InlineCategoriaTetoEditor
                    month={month}
                    categoryId={cat.categoryId}
                    limitCents={cat.limitCents}
                  />
                </div>

                {status.temTeto && cat.limitCents !== null ? (
                  <>
                    <p
                      className={`font-mono text-sm ${
                        estourou ? 'text-warning' : 'text-text-primary'
                      }`}
                    >
                      {`gastei ${formatBRL(cat.gastoCents)} de ${formatBRL(cat.limitCents)}`}
                    </p>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full ${
                          estourou ? 'bg-warning' : 'bg-casa'
                        }`}
                        style={{ width: `${status.pct ?? 0}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="font-mono text-sm text-text-primary">
                    {formatBRL(cat.gastoCents)}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
