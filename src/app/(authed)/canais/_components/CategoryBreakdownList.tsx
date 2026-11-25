import { formatBRL } from '@/lib/format'
import type { CategoriaTotal } from '../_lib/pnl'

interface CategoryBreakdownListProps {
  /** Título da seção, ex.: "Receitas por categoria" / "Custos por categoria". */
  titulo: string
  /** Linhas por categoria já ordenadas desc (PNL-05). */
  itens: CategoriaTotal[]
  /**
   * Tom da barra: 'receita' (positivo) ou 'custo'. Só muda a cor da barra —
   * mantém o layout de CategorySpendingBars.
   */
  tom?: 'receita' | 'custo'
}

/**
 * Lista de totais por categoria (receitas ou custos) no estilo de
 * CategorySpendingBars: barra proporcional ao maior total, formatBRL e estado
 * vazio "Nenhum lançamento este mês." (PNL-05).
 */
export function CategoryBreakdownList({
  titulo,
  itens,
  tom = 'custo',
}: CategoryBreakdownListProps) {
  const maxCents = itens.length > 0 ? itens[0].totalCents : 0
  const barColor = tom === 'receita' ? 'bg-positive' : 'bg-casa'

  return (
    <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
      <h2 className="text-xl font-semibold text-text-primary mb-4">{titulo}</h2>

      {itens.length === 0 ? (
        <p className="text-sm text-text-secondary">Nenhum lançamento este mês.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {itens.map((item) => (
            <div key={item.categoryId} className="flex items-center gap-3">
              <span className="text-sm text-text-primary flex-1 min-w-0 truncate">
                {item.name}
              </span>
              <div className="flex-[2] h-2 rounded-full bg-border">
                <div
                  className={`${barColor} h-full rounded-full`}
                  style={{
                    width: `${maxCents > 0 ? (item.totalCents / maxCents) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-sm font-mono text-text-secondary whitespace-nowrap">
                {formatBRL(item.totalCents)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
