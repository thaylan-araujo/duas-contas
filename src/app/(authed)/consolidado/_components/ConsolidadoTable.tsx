import { formatBRL } from '@/lib/format'
import { corDescriptor } from '@/lib/empresa-cores'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import type {
  LinhaConsolidado,
  TotaisConsolidado,
} from '../_lib/consolidado'

interface ConsolidadoTableProps {
  linhas: LinhaConsolidado[]
  totais: TotaisConsolidado
}

/**
 * Tabela do Consolidado (Fatia 4 — CONS-01/D-02): uma linha por empresa
 * (faturamento bruto/líquido/lucro, DAS estimado, pró-labore) + uma linha de
 * TOTAL em destaque (tfoot). Valores via formatBRL (pt-BR, centavos Int). O DAS
 * mostra "não definido" quando a empresa ainda não tem alíquota (aliquotaDefinida
 * false) — nunca R$ 0,00 silencioso (D-03). A tabela rola na horizontal no mobile
 * (overflow-auto do próprio componente Table). Os totais vêm de somarConsolidado
 * — a invariante "linha TOTAL == soma das linhas" é garantida pela função pura.
 */
export function ConsolidadoTable({ linhas, totais }: ConsolidadoTableProps) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead className="text-right">Faturamento bruto</TableHead>
            <TableHead className="text-right">Faturamento líquido</TableHead>
            <TableHead className="text-right">Lucro</TableHead>
            <TableHead className="text-right">DAS estimado</TableHead>
            <TableHead className="text-right">Pró-labore</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {linhas.map((linha) => {
            const cores = corDescriptor(linha.cor)
            const lucroPositive = linha.lucroCents >= 0
            return (
              <TableRow key={linha.empresaId}>
                <TableCell className="font-medium text-text-primary">
                  <span className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${cores.bg}`}
                      aria-hidden="true"
                    />
                    {linha.nome}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-text-primary">
                  {formatBRL(linha.brutoCents)}
                </TableCell>
                <TableCell className="text-right font-mono text-text-primary">
                  {formatBRL(linha.liquidoCents)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${
                    lucroPositive ? 'text-positive' : 'text-warning'
                  }`}
                >
                  {lucroPositive
                    ? formatBRL(linha.lucroCents)
                    : `Prejuízo ${formatBRL(Math.abs(linha.lucroCents))}`}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {linha.aliquotaDefinida ? (
                    <span className="text-text-primary">
                      {formatBRL(linha.dasEstimadoCents)}
                    </span>
                  ) : (
                    <span className="text-text-secondary">não definido</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-text-primary">
                  {formatBRL(linha.proLaboreCents)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold text-text-primary">
              Total
            </TableCell>
            <TableCell className="text-right font-mono font-semibold text-text-primary">
              {formatBRL(totais.brutoCents)}
            </TableCell>
            <TableCell className="text-right font-mono font-semibold text-text-primary">
              {formatBRL(totais.liquidoCents)}
            </TableCell>
            <TableCell
              className={`text-right font-mono font-semibold ${
                totais.lucroCents >= 0 ? 'text-positive' : 'text-warning'
              }`}
            >
              {totais.lucroCents >= 0
                ? formatBRL(totais.lucroCents)
                : `Prejuízo ${formatBRL(Math.abs(totais.lucroCents))}`}
            </TableCell>
            <TableCell className="text-right font-mono font-semibold text-text-primary">
              {formatBRL(totais.dasEstimadoCents)}
            </TableCell>
            <TableCell className="text-right font-mono font-semibold text-text-primary">
              {formatBRL(totais.proLaboreCents)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
