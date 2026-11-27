// src/app/(authed)/visao-geral/_lib/contas-fixas-bloco.ts
// Funções PURAS (sem Prisma) do bloco "Contas fixas" da Casa: montagem das linhas
// visíveis (uma por conta fixa, com a Transaction gerada quando existir) e a
// MATEMÁTICA DOS CHIPS do hero (WARNING 4 — nunca negativo, reconcilia com o
// comprometido). Dinheiro = Int centavos.

/** Conta fixa cadastrada (shape mínimo p/ o bloco). */
export interface FixaConta {
  id: string
  name: string
  dueDay: number
  amountCents: number
  isVariableAmount: boolean
}

/** Transaction de fixa gerada no mês (shape mínimo p/ o bloco). */
export interface FixaTransacao {
  id: string
  fixedAccountId: string
  status: 'PAGO' | 'EM_ABERTO'
  amountCents: number
  estimatedCents: number | null
  dueDate: Date | null
  isVariableAmount: boolean
}

/** Uma linha do bloco: a conta fixa + sua Transaction do mês (ou null se não gerada). */
export interface LinhaContaFixa {
  fixedAccountId: string
  nome: string
  dueDay: number
  isVariableAmount: boolean
  /** null = ainda não gerada neste mês (usuário não clicou "gerar contas do mês"). */
  transacaoId: string | null
  status: 'PAGO' | 'EM_ABERTO' | null
  amountCents: number
  estimatedCents: number | null
  dueDate: Date | null
}

/**
 * Monta as linhas do bloco: uma por conta fixa, casada com sua Transaction do mês
 * (via fixedAccountId). Sem Transaction → linha "não gerada" (status null). Ordena
 * em aberto primeiro por vencimento, depois pagas, depois não geradas — por dueDay.
 */
export function montarLinhasContasFixas(
  contas: FixaConta[],
  transacoes: FixaTransacao[]
): LinhaContaFixa[] {
  const txPorFixa = new Map(transacoes.map((t) => [t.fixedAccountId, t]))

  const linhas: LinhaContaFixa[] = contas.map((c) => {
    const tx = txPorFixa.get(c.id)
    return {
      fixedAccountId: c.id,
      nome: c.name,
      dueDay: c.dueDay,
      isVariableAmount: c.isVariableAmount,
      transacaoId: tx?.id ?? null,
      status: tx?.status ?? null,
      amountCents: tx?.amountCents ?? c.amountCents,
      estimatedCents: tx?.estimatedCents ?? null,
      dueDate: tx?.dueDate ?? null,
    }
  })

  const rank = (l: LinhaContaFixa): number => {
    if (l.status === 'EM_ABERTO') return 0
    if (l.status === 'PAGO') return 1
    return 2 // não gerada
  }

  return linhas.sort((a, b) => {
    const r = rank(a) - rank(b)
    if (r !== 0) return r
    const da = a.dueDate ? a.dueDate.getTime() : a.dueDay
    const db = b.dueDate ? b.dueDate.getTime() : b.dueDay
    return da - db
  })
}

/**
 * Matemática dos chips do hero (WARNING 4). A partir do gasto real PAGO total da
 * Casa (`totalSpentPago`) e das Transactions de fixas do mês:
 * - `fixasPagasCents` = Σ amountCents das fixas PAGO (valor REAL pago).
 * - `contasFixasCents` (chip "Contas fixas") = contribuição das fixas ao
 *   comprometido: PAGO usa amountCents; EM_ABERTO usa estimatedCents quando "a
 *   definir", senão amountCents.
 * - `jaPagoCents` (chip "Já pago") = totalSpentPago (fixas pagas + avulsas pagas).
 * - `variavelCents` (chip "Variável gasto") = max(0, totalSpentPago − fixasPagas)
 *   — NUNCA negativo; é o gasto variável real do mês (exclui as fixas pagas, que já
 *   aparecem no chip Contas fixas). Reconcilia com o comprometido sem sobreposição.
 */
export function computeChipsContasFixas(
  totalSpentPagoCents: number,
  transacoes: FixaTransacao[]
): {
  fixasPagasCents: number
  contasFixasCents: number
  jaPagoCents: number
  variavelCents: number
} {
  let fixasPagasCents = 0
  let contasFixasCents = 0

  for (const t of transacoes) {
    if (t.status === 'PAGO') {
      fixasPagasCents += t.amountCents
      contasFixasCents += t.amountCents
    } else {
      // EM_ABERTO: "a definir" usa estimativa; valor certo usa amountCents.
      contasFixasCents += t.isVariableAmount
        ? (t.estimatedCents ?? 0)
        : t.amountCents
    }
  }

  const jaPagoCents = totalSpentPagoCents
  const variavelCents = Math.max(0, totalSpentPagoCents - fixasPagasCents)

  return { fixasPagasCents, contasFixasCents, jaPagoCents, variavelCents }
}
