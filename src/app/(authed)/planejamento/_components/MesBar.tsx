// src/app/(authed)/planejamento/_components/MesBar.tsx
// Server Component — barra "Dinheiro do mês" (D-02/CASA-R-01). Mostra o valor
// do mês (editável inline, reusa InlineCeilingEditor) e o restante (dinheiro −
// despesas da Casa no mês), com uma barra de progresso da fração já gasta.
import { formatBRL } from '@/lib/format'
import { InlineCeilingEditor } from '../../visao-geral/_components/InlineCeilingEditor'

interface MesBarProps {
  month: string // "YYYY-MM"
  dinheiroMesCents: number
  despesasMesCents: number
  restanteCents: number
}

export function MesBar({
  month,
  dinheiroMesCents,
  despesasMesCents,
  restanteCents,
}: MesBarProps) {
  // Fração já gasta (0..100). Evita divisão por zero quando o dinheiro é zero.
  const pctGasto =
    dinheiroMesCents > 0
      ? Math.min(100, Math.round((despesasMesCents / dinheiroMesCents) * 100))
      : 0

  const estourou = restanteCents < 0

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <p className="mb-2 text-sm font-sans text-text-secondary">Dinheiro do mês</p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <InlineCeilingEditor initialCents={dinheiroMesCents} month={month} />
        <p
          className={`font-mono text-sm font-medium ${
            estourou ? 'text-warning' : 'text-positive'
          }`}
        >
          {estourou
            ? `Passou ${formatBRL(Math.abs(restanteCents))}`
            : `restam ${formatBRL(restanteCents)}`}
        </p>
      </div>

      {/* Barra de progresso da fração gasta (limitada a 100%). */}
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${estourou ? 'bg-warning' : 'bg-casa'}`}
          style={{ width: `${pctGasto}%` }}
        />
      </div>

      <p className="mt-2 text-xs font-sans text-text-secondary">
        Gasto {formatBRL(despesasMesCents)} de {formatBRL(dinheiroMesCents)}
      </p>
    </section>
  )
}
