import { formatBRL } from '@/lib/format'

interface CategorySpendingItem {
  categoryId: string
  name: string
  totalCents: number
}

interface CategorySpendingBarsProps {
  categorySpending: CategorySpendingItem[]
}

export function CategorySpendingBars({ categorySpending }: CategorySpendingBarsProps) {
  const maxCents = categorySpending.length > 0 ? categorySpending[0].totalCents : 0

  return (
    <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
      <h2 className="text-xl font-semibold text-text-primary mb-4">
        Para onde vai o dinheiro
      </h2>

      {categorySpending.length === 0 ? (
        <p className="text-sm text-text-secondary">Nenhum gasto registrado este mês.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {categorySpending.map((item) => (
            <div key={item.categoryId} className="flex items-center gap-3">
              <span className="text-sm text-text-primary flex-1 min-w-0 truncate">
                {item.name}
              </span>
              <div className="flex-[2] h-2 rounded-full bg-border">
                <div
                  className="bg-casa h-full rounded-full"
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
