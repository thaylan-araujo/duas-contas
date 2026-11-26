import { formatBRL } from '@/lib/format'
import { corDescriptor } from '@/lib/empresa-cores'
import type { LinhaRendaPorOrigem } from '../_lib/renda-familiar'

interface RendaFamiliarPorOrigemProps {
  /** Linhas já agrupadas e ordenadas pelo loader (PL-05/D-04). */
  linhas: LinhaRendaPorOrigem[]
}

/**
 * Bloco "Renda familiar por origem" da Visão Geral da Casa (PL-05/D-04).
 *
 * Mostra quanto entrou de cada empresa de origem (via origemEmpresaId, do
 * pró-labore) mais "Outras entradas" (origem null — ex.: salário). As linhas já
 * vêm ordenadas desc do loader, com "Outras entradas" por último. Cada linha:
 * swatch da cor da empresa (neutro para "Outras entradas"/empresa removida) +
 * nome + valor em R$ (formatBRL). Estado vazio: "Nenhuma entrada na Casa neste
 * mês." Mesma linguagem visual de CategoryBreakdownList (cartão branco,
 * valores em fonte mono). Server Component — sem estado cliente.
 */
export function RendaFamiliarPorOrigem({ linhas }: RendaFamiliarPorOrigemProps) {
  return (
    <div className="rounded-2xl shadow-sm border border-border p-6 bg-card">
      <h2 className="text-xl font-semibold text-text-primary mb-4">
        Renda familiar por origem
      </h2>

      {linhas.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Nenhuma entrada na Casa neste mês.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {linhas.map((linha) => {
            const swatchClass =
              linha.cor !== null ? corDescriptor(linha.cor).bg : 'bg-border'
            return (
              <div
                key={linha.origemEmpresaId ?? '__outras__'}
                className="flex items-center gap-3"
              >
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${swatchClass}`}
                  aria-hidden="true"
                />
                <span className="text-sm text-text-primary flex-1 min-w-0 truncate">
                  {linha.nome}
                </span>
                <span className="text-sm font-mono text-text-secondary whitespace-nowrap">
                  {formatBRL(linha.totalCents)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
