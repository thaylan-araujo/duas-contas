// src/lib/whatsapp/service.ts
// Helpers de banco da Fatia 1 (09-02 Task 2): allowlist (resolveContact) e
// idempotência (dedupeInbound). Módulo plain-async SEM 'use server', usa o
// singleton `@/lib/prisma` (NUNCA new PrismaClient). Toda query é escopada pelo
// phone resolvido (ASVS V4). Os loaders de contexto da IA (getEmpresas /
// getCategories) são REUSADOS dos módulos existentes — não reimplementados aqui.
import { prisma } from '@/lib/prisma'

/**
 * Resolve o contato ativo da allowlist por telefone (D-02/D-06). Retorna o
 * registro (com `userId`) quando há um contato ATIVO; caso contrário null — o
 * chamador ignora com 200 sem vazar dados (anti-objetivo nº 4 / T-09-04).
 */
export async function resolveContact(phone: string) {
  return prisma.whatsappContact.findFirst({
    where: { phone, active: true },
  })
}

/**
 * Registra a mensagem recebida para garantir idempotência (D-06 / T-09-02).
 * Insere `WhatsappInbound` ANTES de lançar; a `@@unique(messageId)` transforma a
 * reentrega da Evolution numa violação P2002, detectada aqui → `{duplicate:true}`
 * (NÃO relançar). Qualquer outro erro propaga (não engolimos falhas inesperadas).
 */
export async function dedupeInbound({
  messageId,
  phone,
}: {
  messageId: string
  phone: string
}): Promise<{ duplicate: boolean }> {
  try {
    await prisma.whatsappInbound.create({
      data: { messageId, phone, processed: false },
    })
    return { duplicate: false }
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return { duplicate: true }
    }
    throw error
  }
}
