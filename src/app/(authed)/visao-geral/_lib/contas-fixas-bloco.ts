// src/app/(authed)/visao-geral/_lib/contas-fixas-bloco.ts
// Funções PURAS (sem Prisma) do bloco "Contas fixas" da Casa. O bloco é CENTRADO
// EM TRANSAÇÃO (UAT Fase 10): uma linha por lançamento Casa-SAIDA do mês na
// categoria "Contas fixas" — seja gerado de uma fixa OU digitado à mão. A
// MATEMÁTICA DOS CHIPS do hero (WARNING 4 — nunca negativo, reconcilia com o
// comprometido) opera sobre essas mesmas transações. Dinheiro = Int centavos.

/**
 * Transaction da categoria "Contas fixas" no mês (shape mínimo p/ o bloco).
 * Pode ou não ter uma fixa vinculada: lançamentos avulsos têm
 * `isVariableAmount = false` e tipicamente `estimatedCents = null`.
 */
export interface FixaTransacao {
  id: string
  /** Rótulo da linha = description da transação (fixas geradas já carregam o nome). */
  descricao: string
  status: 'PAGO' | 'EM_ABERTO'
  amountCents: number
  estimatedCents: number | null
  dueDate: Date | null
  /** Da fixa vinculada (se houver); lançamento avulso → false. */
  isVariableAmount: boolean
}

/** Uma linha do bloco: um lançamento da categoria "Contas fixas" do mês. */
export interface LinhaContaFixa {
  transacaoId: string
  nome: string
  isVariableAmount: boolean
  status: 'PAGO' | 'EM_ABERTO'
  amountCents: number
  estimatedCents: number | null
  dueDate: Date | null
}

/**
 * Monta as linhas do bloco: uma por lançamento da categoria "Contas fixas" do
 * mês, usando a `descricao` da transação como rótulo. Ordena em aberto primeiro
 * (por vencimento), depois pagas — ambos por dueDate (nulos ao fim).
 */
export function montarLinhasContasFixas(
  transacoes: FixaTransacao[]
): LinhaContaFixa[] {
  const linhas: LinhaContaFixa[] = transacoes.map((t) => ({
    transacaoId: t.id,
    nome: t.descricao,
    isVariableAmount: t.isVariableAmount,
    status: t.status,
    amountCents: t.amountCents,
    estimatedCents: t.estimatedCents,
    dueDate: t.dueDate,
  }))

  const rank = (l: LinhaContaFixa): number => (l.status === 'EM_ABERTO' ? 0 : 1)

  return linhas.sort((a, b) => {
    const r = rank(a) - rank(b)
    if (r !== 0) return r
    // dueDate asc, nulos ao fim.
    const da = a.dueDate ? a.dueDate.getTime() : Number.POSITIVE_INFINITY
    const db = b.dueDate ? b.dueDate.getTime() : Number.POSITIVE_INFINITY
    return da - db
  })
}

/**
 * Matemática dos chips do hero (WARNING 4). A partir do gasto real PAGO total da
 * Casa (`totalSpentPago`) e das Transactions da categoria "Contas fixas" do mês:
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
