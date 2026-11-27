// src/app/(authed)/planejamento/_lib/comprometido.ts
// Funções puras do "comprometido" / "posso gastar ainda" da Casa (sem Prisma —
// maximamente testáveis). Fatia 10-01 (R-2). Dinheiro = Int centavos.
//
// Regra inviolável (R-2, anti-objetivo §4): CADA LINHA CONTA UMA VEZ SÓ. A
// transição em aberto→pago é a MESMA linha mudando de `status` (não cria outra
// linha): quando PAGO ela entra na soma de pagos e some da lista de em aberto —
// logo o comprometido é idêntico antes e depois (sem contagem dupla). A função
// pura apenas soma o que recebe; a separação das duas listas é do chamador
// (loader) via os leitores Prisma (getTotalSpent PAGO + getEmAbertoCasa).

/**
 * Uma linha SAIDA da Casa EM ABERTO que entra no "comprometido".
 * - `amountCents`: valor da linha (usado quando o valor é certo).
 * - `estimatedCents`: estimativa (mês-anterior-PAGO — R-5) usada quando o valor
 *   é "a definir"; null quando não há histórico.
 * - `isVariableAmount`: true quando a conta é "a definir" (ex.: luz/água) e o
 *   valor real só se conhece ao pagar — nesse caso usa a estimativa.
 */
export interface EmAbertoLinha {
  amountCents: number
  estimatedCents: number | null
  isVariableAmount: boolean
}

/**
 * comprometido = Σ pagos + Σ(por linha em aberto: "a definir" usa a estimativa,
 * senão o valor certo). "A definir" sem estimativa (estimatedCents null) soma 0
 * — nunca infla o número sem histórico (R-5). R-2.
 */
export function computeComprometido(
  pagosCents: number,
  emAberto: EmAbertoLinha[]
): number {
  const emAbertoCents = emAberto.reduce((acc, linha) => {
    const valor = linha.isVariableAmount
      ? (linha.estimatedCents ?? 0)
      : linha.amountCents
    return acc + valor
  }, 0)
  return pagosCents + emAbertoCents
}

/**
 * posso gastar ainda = entradas − comprometido. Pode ser negativo (comprometido
 * maior que o dinheiro do mês). Ex.: (850000, 530000) → 320000.
 */
export function computePossoGastar(
  entradasCents: number,
  comprometidoCents: number
): number {
  return entradasCents - comprometidoCents
}
