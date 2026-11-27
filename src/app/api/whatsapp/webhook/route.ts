// src/app/api/whatsapp/webhook/route.ts
// Route Handler do webhook do WhatsApp (Fatia 1 / 09-02 Task 3). Orquestra a cola
// ponta-a-ponta do CAMINHO FELIZ com destino explícito:
//   segredo → parse → fromMe/grupo → allowlist → dedupe → IA → Zod → resolve →
//   createTransactionService (REUSO, regra Casa×Empresa mora lá) → sendText.
// SEMPRE responde 200 — um 4xx/5xx faz a Evolution reentregar (retry); a dedupe +
// "já processado" cobrem reentregas legítimas (Pitfall 2). A regra Casa×Empresa é
// CÓDIGO (resolveDestino/resolveCategoria): o LLM nunca decide empresaId/categoryId
// final (T-09-06). O fluxo multi-turno (persistir pendência) é o 09-03 — aqui, se
// destino/categoria ficam incertos, respondemos uma pergunta simples e 200.
import { parseInbound, type EvolutionWebhookBody } from '@/lib/whatsapp/parse'
import { resolveDestino, resolveCategoria } from '@/lib/whatsapp/resolve'
import { aiResultSchema } from '@/lib/whatsapp/schema'
import { extractLancamento } from '@/lib/whatsapp/ai'
import { sendText } from '@/lib/whatsapp/evolution'
import { resolveContact, dedupeInbound } from '@/lib/whatsapp/service'
import {
  confirmacaoLancamento,
  perguntaDestino,
  perguntaCategoria,
  relatorioIndisponivel,
  ajuda,
} from '@/lib/whatsapp/messages'
import { getEmpresas } from '@/app/(authed)/empresas/_lib/loader'
import { getCategories } from '@/app/(authed)/lancamentos/_lib/loader'
import { createTransactionService } from '@/app/(authed)/lancamentos/_lib/service'
import { transactionSchema } from '@/app/(authed)/lancamentos/_lib/schema'
import { verifyWebhookSecret } from '@/lib/whatsapp/security'

export const runtime = 'nodejs' // Prisma não roda em edge
export const dynamic = 'force-dynamic' // nunca cachear um webhook

/** Resposta 200 padrão — o webhook quase sempre retorna 200 (ver cabeçalho). */
function ok(payload: Record<string, unknown> = { ok: true }) {
  return Response.json(payload, { status: 200 })
}

export async function POST(req: Request) {
  // (1) Segredo — falha = 200 ignore (não revela; não reenfileira) — T-09-01.
  if (!verifyWebhookSecret(req, process.env.WHATSAPP_WEBHOOK_SECRET)) {
    return ok({ ignored: true })
  }

  try {
    const body = (await req.json()) as EvolutionWebhookBody
    const msg = parseInbound(body)

    // (3) Eco do próprio bot ou mensagem de grupo → 200 ANTES do LLM (T-09-03).
    if (msg.fromMe || msg.isGroup) {
      return ok({ ignored: true })
    }

    // (4) Allowlist — número desconhecido nunca é processado nem vaza (T-09-04).
    const contact = await resolveContact(msg.phone)
    if (!contact) {
      return ok({ ignored: true })
    }
    const userId = contact.userId

    // (5) Idempotência — reentrega (mesmo messageId) → 200 sem relançar (T-09-02).
    const { duplicate } = await dedupeInbound({ messageId: msg.messageId, phone: msg.phone })
    if (duplicate) {
      return ok({ duplicate: true })
    }

    // (6) Contexto do usuário + extração estruturada (Claude Haiku).
    const [empresas, categorias] = await Promise.all([
      getEmpresas(userId),
      getCategories(userId),
    ])
    const ctx = {
      empresas: empresas.map((e) => e.nome), // W2: Empresa expõe `nome`
      categorias: categorias.map((c) => c.name), // Category expõe `name`
      hoje: new Date().toISOString().slice(0, 10),
    }
    const raw = await extractLancamento(msg.text, ctx)

    // (7) Valida o shape da IA com Zod — inválido → ajuda + 200.
    const parsed = aiResultSchema.safeParse(raw)
    if (!parsed.success) {
      await sendText(msg.phone, ajuda())
      return ok({ handled: 'ajuda' })
    }
    const ai = parsed.data

    // (8) Roteia por intent.
    if (ai.intent === 'relatorio') {
      await sendText(msg.phone, relatorioIndisponivel())
      return ok({ handled: 'relatorio' })
    }
    if (ai.intent !== 'lancar') {
      await sendText(msg.phone, ajuda())
      return ok({ handled: 'ajuda' })
    }

    // intent === 'lancar' — resolver destino e categoria (regra Casa×Empresa).
    const destino = resolveDestino(ai.destino, empresas)
    if (!('empresaId' in destino)) {
      await sendText(msg.phone, perguntaDestino())
      return ok({ handled: 'ask_destino' })
    }
    const empresaId = destino.empresaId

    const categoriaRefs = categorias.map((c) => ({
      id: c.id,
      name: c.name,
      empresaId: c.empresaId,
    }))
    const categoria = resolveCategoria(ai.categoria, categoriaRefs, empresaId)
    if (!('categoryId' in categoria)) {
      await sendText(msg.phone, perguntaCategoria())
      return ok({ handled: 'ask_categoria' })
    }
    const categoriaResolvida = categorias.find((c) => c.id === categoria.categoryId)
    const categoriaNome = categoriaResolvida?.name ?? ''

    // Campos obrigatórios do lançamento ausentes (tipo/valor/data) → pergunta ajuda.
    if (!ai.tipo || !ai.valorCents || !ai.data) {
      await sendText(msg.phone, ajuda())
      return ok({ handled: 'ajuda' })
    }

    // Monta o payload e valida com o MESMO transactionSchema do form (W1).
    // description = nome da categoria resolvida (AiResult não tem description).
    const payload = {
      date: ai.data, // YYYY-MM-DD; o service faz parseISO (nunca Date à mão)
      description: categoriaNome,
      amountCents: ai.valorCents,
      type: ai.tipo,
      empresaId, // null = Casa (D-03)
      categoryId: categoria.categoryId, // categoria EXISTENTE (D-04)
    }
    const validated = transactionSchema.safeParse(payload)
    if (!validated.success) {
      await sendText(msg.phone, ajuda())
      return ok({ handled: 'ajuda' })
    }

    await createTransactionService({ ...validated.data, userId })

    const destinoLabel = empresaId
      ? empresas.find((e) => e.id === empresaId)?.nome ?? 'Empresa'
      : 'Casa'
    await sendText(
      msg.phone,
      confirmacaoLancamento(validated.data.amountCents, categoriaNome, destinoLabel)
    )
    return ok({ created: true })
  } catch (error) {
    // Erro interno capturado: logar mensagem genérica (sem body/segredo — T-09-07)
    // e responder 200 para não disparar retry da Evolution. A dedupe cobre reentregas.
    console.error('[whatsapp webhook] erro ao processar mensagem:', (error as Error)?.message)
    return ok({ error: 'internal' })
  }
}
