// src/lib/whatsapp/security.ts
// Autenticação do canal do webhook (D-06 / ASVS V2+V6). A Evolution não assina
// HMAC por padrão; usamos um segredo compartilhado que pode chegar por header
// `x-webhook-secret` OU query `?secret=` (o setup escolhe qual na URL do
// set-webhook — 09-RESEARCH Open Question 1). A comparação é CONSTANT-TIME com
// crypto.timingSafeEqual — NUNCA `===` (evita timing attack, T-09-01).
import { timingSafeEqual } from 'node:crypto'

/**
 * Compara `a` e `b` em tempo constante, sem vazar o comprimento. timingSafeEqual
 * exige buffers do MESMO tamanho; se os comprimentos diferem, já sabemos que são
 * diferentes — mas ainda rodamos uma comparação dummy do mesmo tamanho para não
 * encurtar o caminho (e retornamos false).
 */
function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) {
    // Compara bufA consigo mesmo só para gastar um tempo comparável, e falha.
    timingSafeEqual(bufA, bufA)
    return false
  }
  return timingSafeEqual(bufA, bufB)
}

/**
 * Valida o segredo do webhook contra `expected` (o WHATSAPP_WEBHOOK_SECRET).
 * Aceita o segredo via header `x-webhook-secret` OU query string `?secret=`.
 * Retorna false quando o esperado não está configurado ou o segredo está ausente
 * — o chamador responde 200 {ignored} sem revelar o motivo (T-09-01).
 */
export function verifyWebhookSecret(
  req: Request,
  expected: string | undefined | null
): boolean {
  if (!expected) return false

  const header = req.headers.get('x-webhook-secret')
  let query: string | null = null
  try {
    query = new URL(req.url).searchParams.get('secret')
  } catch {
    query = null
  }

  const provided = header ?? query
  if (!provided) return false

  return constantTimeEquals(provided, expected)
}
