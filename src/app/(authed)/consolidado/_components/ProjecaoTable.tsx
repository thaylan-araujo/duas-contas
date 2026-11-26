import { formatBRL } from '@/lib/format'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import type { MesProjetado } from '../_lib/projecao'

interface ProjecaoTableProps {
  /** Título do bloco: "Projeção — Família" ou o nome da empresa. */
  titulo: string
  /** Meses projetados (3–6) — cada um já traz sobra/negativo/faltamCents. */
  meses: MesProjetado[]
}

/**
 * Tabela da PROJEÇÃO simples (Fatia 4 — CONS-03/CONS-04 / D-04/D-05): colunas por
 * mês (mesLabel) com a sobra projetada (formatBRL), no espírito do fluxo de caixa
 * por mês do spec §5. O mês com `negativo === true` é destacado (text-warning +
 * fundo de alerta) mostrando "faltam R$ ..." (D-05) — o destaque usa diretamente
 * a flag `negativo`/`faltamCents` de cada MesProjetado, sem recalcular na UI.
 *
 * Mostra um rótulo explícito e visível de que é ESTIMATIVA baseada na média dos
 * últimos meses (D-04) — a projeção não é cumulativa (cada mês é independente, não
 * rastreamos saldo de caixa). Estilo rounded-2xl/bg-card consistente com os demais
 * componentes; rola na horizontal no mobile (overflow-auto do próprio Table). Sem
 * histórico → sobras zeradas com o rótulo de estimativa (não quebra).
 */
export function ProjecaoTable({ titulo, meses }: ProjecaoTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-1 text-base font-semibold text-text-primary">
        {titulo}
      </h3>
      <p className="mb-3 text-xs text-text-secondary">
        Estimativa baseada na média dos últimos meses — não é uma garantia. Cada
        mês é projetado isoladamente (não acompanhamos saldo de caixa).
      </p>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {meses.map((mes) => (
                <TableHead key={mes.mesLabel} className="text-right capitalize">
                  {mes.mesLabel}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow>
              {meses.map((mes) => (
                <TableCell
                  key={mes.mesLabel}
                  className={`text-right font-mono align-top ${
                    mes.negativo ? 'bg-warning/10 text-warning' : 'text-text-primary'
                  }`}
                >
                  <span className="block">{formatBRL(mes.sobraCents)}</span>
                  {mes.negativo && (
                    <span className="mt-1 block text-xs font-sans">
                      faltam {formatBRL(mes.faltamCents)}
                    </span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
