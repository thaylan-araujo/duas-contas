// src/lib/whatsapp/messages.ts
// Textos PT-BR curtos das respostas do bot. Toda formatação de R$ passa por
// @/lib/format (regra do projeto: NUNCA formatar inline). Centralizar aqui mantém
// o tom consistente e separa a cópia da orquestração.
import { formatBRL } from '@/lib/format'

/**
 * Confirmação de lançamento criado. destinoLabel = 'Casa' quando empresaId é null,
 * senão o nome da empresa. Ex.: "✓ R$ 50,00 · Gasolina · Casa".
 */
export function confirmacaoLancamento(
  amountCents: number,
  categoriaNome: string,
  destinoLabel: string
): string {
  return `✓ ${formatBRL(amountCents)} · ${categoriaNome} · ${destinoLabel}`
}

/** Destino não ficou claro (faltou/ambíguo) — pergunta simples, sem persistir ainda. */
export function perguntaDestino(): string {
  return 'Para qual conta é esse lançamento: Casa ou o nome da empresa?'
}

/** Categoria não ficou clara (faltou/ambígua) — pergunta simples, sem persistir ainda. */
export function perguntaCategoria(): string {
  return 'Qual a categoria desse lançamento?'
}

/** Relatórios ainda não disponíveis nesta fatia (chegam no 09-03/Fatia 3). */
export function relatorioIndisponivel(): string {
  return 'Os relatórios por WhatsApp chegam numa próxima atualização.'
}

/** Fallback de ajuda / mensagem não compreendida. */
export function ajuda(): string {
  return 'Me diga o que gastou ou recebeu, o valor e a conta. Ex.: "gastei 50 de gasolina na Casa".'
}
