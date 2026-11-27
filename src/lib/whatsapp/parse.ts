// src/lib/whatsapp/parse.ts
// Função pura: normaliza o payload do webhook da Evolution API numa mensagem
// simples. SEM Prisma, SEM rede — maximamente testável. Fatia 1 (09-01).
// Caminhos dos campos confirmados na pesquisa (09-RESEARCH, Pitfall 1):
// texto em data.message.conversation OU data.message.extendedTextMessage.text;
// idempotência por data.key.id; grupo = remoteJid @g.us; endereçamento @lid
// traz o número real em data.key.remoteJidAlt.

interface EvolutionKey {
  remoteJid?: string
  remoteJidAlt?: string
  fromMe?: boolean
  id?: string
}

interface EvolutionMessage {
  conversation?: string
  extendedTextMessage?: { text?: string }
}

interface EvolutionData {
  key?: EvolutionKey
  message?: EvolutionMessage
  pushName?: string
}

export interface EvolutionWebhookBody {
  data?: EvolutionData
}

export interface InboundMessage {
  remoteJid: string
  phone: string
  fromMe: boolean
  isGroup: boolean
  messageId: string
  pushName: string
  text: string
}

/** Extrai só os dígitos do JID (remove o sufixo de domínio @s.whatsapp.net/@lid/@g.us). */
function jidToPhone(jid: string): string {
  return (jid.split('@')[0] ?? '').replace(/\D/g, '')
}

/**
 * Normaliza o corpo do webhook da Evolution numa InboundMessage. Tolerante a
 * campos ausentes (texto vazio quando não há conversation/extendedTextMessage).
 */
export function parseInbound(body: EvolutionWebhookBody): InboundMessage {
  const data = body?.data ?? {}
  const key = data.key ?? {}
  const remoteJid = key.remoteJid ?? ''
  const isGroup = remoteJid.endsWith('@g.us')
  const message = data.message ?? {}
  const text = message.conversation ?? message.extendedTextMessage?.text ?? ''
  // Endereçamento @lid: o remoteJid é opaco; o número real vem em remoteJidAlt.
  const phoneSource = remoteJid.endsWith('@lid') ? (key.remoteJidAlt ?? remoteJid) : remoteJid

  return {
    remoteJid,
    phone: jidToPhone(phoneSource),
    fromMe: key.fromMe === true,
    isGroup,
    messageId: key.id ?? '',
    pushName: data.pushName ?? '',
    text,
  }
}
