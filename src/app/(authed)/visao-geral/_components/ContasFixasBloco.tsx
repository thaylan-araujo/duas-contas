'use client'
// src/app/(authed)/visao-geral/_components/ContasFixasBloco.tsx
// Bloco "Contas fixas" da Casa (C6/UI-SPEC §2): cabeçalho + resumo, botão "gerar
// contas do mês" (idempotente), linhas com vencimento/valor-ou-"a definir"/pílula
// de status/"marcar pago". Estados vazios cobertos. Toda formatação via format.ts.
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { formatBRL, formatDate } from '@/lib/format'
import { StatusPill } from './StatusPill'
import { MarcarPagoDialog } from './MarcarPagoDialog'
import { gerarContasDoMesAction } from '../_lib/actions'
import type { LinhaContaFixa } from '../_lib/contas-fixas-bloco'

interface ContasFixasBlocoProps {
  month: string
  linhas: LinhaContaFixa[]
}

export function ContasFixasBloco({ month, linhas }: ContasFixasBlocoProps) {
  const [isGerando, startGerar] = useTransition()
  const [gerarErro, setGerarErro] = useState('')
  const [marcando, setMarcando] = useState<LinhaContaFixa | null>(null)

  const emAberto = linhas.filter((l) => l.status === 'EM_ABERTO')
  const totalCents = linhas.reduce((acc, l) => {
    if (l.status === 'PAGO') return acc + l.amountCents
    if (l.status === 'EM_ABERTO')
      return acc + (l.isVariableAmount ? (l.estimatedCents ?? 0) : l.amountCents)
    return acc
  }, 0)

  function handleGerar() {
    setGerarErro('')
    startGerar(async () => {
      const result = await gerarContasDoMesAction(month)
      if (!result.success) {
        setGerarErro(result.error ?? 'Não foi possível gerar as contas do mês.')
      }
    })
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Contas fixas</h2>
          <p className="text-sm text-text-secondary">
            {formatBRL(totalCents)} · {emAberto.length} em aberto
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleGerar}
          disabled={isGerando}
          aria-busy={isGerando}
          className="min-h-[44px]"
        >
          {isGerando ? 'Gerando…' : 'Gerar contas do mês'}
        </Button>
      </div>

      {gerarErro && (
        <p className="mb-3 text-sm text-destructive" role="alert">{gerarErro}</p>
      )}

      {linhas.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Nenhuma conta fixa cadastrada. Cadastre em{' '}
          <a href="/contas-fixas" className="font-medium text-casa underline">
            Contas fixas
          </a>
          .
        </p>
      ) : emAberto.length === 0 && linhas.every((l) => l.status !== null) ? (
        <p className="text-sm text-positive">Tudo pago ✓</p>
      ) : null}

      {linhas.length > 0 && (
        <ul className="divide-y divide-border">
          {linhas.map((l) => (
            <li
              key={l.fixedAccountId}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {l.nome}
                </p>
                <p className="text-xs text-text-secondary">
                  {l.dueDate ? `Vence ${formatDate(l.dueDate)}` : 'Não gerada'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  {l.status === null ? (
                    <span className="text-sm text-text-secondary">—</span>
                  ) : l.isVariableAmount && l.status === 'EM_ABERTO' ? (
                    <div>
                      <span className="block text-sm font-mono text-text-primary">
                        a definir
                      </span>
                      {(l.estimatedCents ?? 0) > 0 && (
                        <span className="block text-xs font-mono text-text-secondary">
                          ~ {formatBRL(l.estimatedCents ?? 0)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm font-mono text-text-primary">
                      {formatBRL(l.amountCents)}
                    </span>
                  )}
                </div>

                {l.status !== null && <StatusPill status={l.status} />}

                {l.status === 'EM_ABERTO' && l.transacaoId && (
                  <Button
                    variant="ghost"
                    onClick={() => setMarcando(l)}
                    className="min-h-[44px]"
                  >
                    Marcar pago
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {marcando && marcando.transacaoId && (
        <MarcarPagoDialog
          open={!!marcando}
          onClose={() => setMarcando(null)}
          transacao={{
            id: marcando.transacaoId,
            descricao: marcando.nome,
            isVariableAmount: marcando.isVariableAmount,
            estimatedCents: marcando.estimatedCents,
          }}
        />
      )}
    </section>
  )
}
