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

// --- Ação pendente (multi-turno) -----------------------------------------
// O serverless é stateless (D-07): quando falta destino/categoria, guardamos a
// extração PARCIAL no Postgres com TTL e a próxima mensagem do mesmo número
// completa o lançamento. Uma pendência por número (`phone @unique`).

/**
 * Busca a ação pendente VIVA do número (`expiresAt > now`). O filtro `gt:now`
 * garante que uma pendência expirada nunca é retornada — ela não pode
 * "sequestrar" uma mensagem nova e solta (T-09-08); o chamador a trata como uma
 * extração fresca. `now` é injetável para o teste ser determinístico.
 */
export async function findPendingAction(phone: string, now: Date = new Date()) {
  return prisma.whatsappPendingAction.findFirst({
    where: { phone, expiresAt: { gt: now } },
  })
}

/**
 * Grava/atualiza a ação pendente do número com a extração parcial e um TTL
 * curto. `expiresAt = now + ttlMinutes`; `now` injetável (teste determinístico).
 * Upsert por `phone` (@unique): sempre uma única pendência por número. Não
 * logamos o `partial` — ele carrega dado financeiro parcial (T-09-09).
 */
export async function upsertPendingAction({
  phone,
  kind,
  partial,
  ttlMinutes,
  now = new Date(),
}: {
  phone: string
  kind: string
  partial: unknown
  ttlMinutes: number
  now?: Date
}) {
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000)
  const data = { kind, partial: partial as object, expiresAt }
  return prisma.whatsappPendingAction.upsert({
    where: { phone },
    create: { phone, ...data },
    update: data,
  })
}

/**
 * Remove a ação pendente do número — chamado quando o lançamento completa (ou
 * para descartar uma pendência inválida). `deleteMany` é idempotente (não falha
 * se não houver linha).
 */
export async function clearPendingAction(phone: string) {
  return prisma.whatsappPendingAction.deleteMany({ where: { phone } })
}
