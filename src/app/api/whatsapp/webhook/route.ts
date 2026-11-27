// src/app/api/whatsapp/webhook/route.ts
// Route Handler do webhook do WhatsApp (Fatia 1 / 09-02 Task 3). Orquestra a cola
// ponta-a-ponta do CAMINHO FELIZ com destino explícito:
//   segredo → parse → fromMe/grupo → allowlist → dedupe → IA → Zod → resolve →
//   createTransactionService (REUSO, regra Casa×Empresa mora lá) → sendText.
// SEMPRE responde 200 — um 4xx/5xx faz a Evolution reentregar (retry); a dedupe +
// "já processado" cobrem reentregas legítimas (Pitfall 2). A regra Casa×Empresa é
// CÓDIGO (resolveDestino/resolveCategoria): o LLM nunca decide empresaId/categoryId
// final (T-09-06).
//
// Multi-turno (09-03 / C-2): ANTES da IA, buscamos uma ação pendente VIVA do
// número (findPendingAction, TTL). Se existe, a mensagem atual É a RESPOSTA: o
// texto preenche o campo que faltava (destino ou categoria), re-resolvemos e, se
// completo, lançamos + limpamos a pendência. Quando destino/categoria ficam
// incertos (fluxo normal ou após a resposta), gravamos a extração PARCIAL com TTL
// e perguntamos — nunca adivinhamos (anti-objetivo nº 1). Categoria nova NUNCA é
// criada por chat (D-04): quando não casa, oferecemos as categorias existentes.
import { parseInbound, type EvolutionWebhookBody } from '@/lib/whatsapp/parse'
import { resolveDestino, resolveCategoria } from '@/lib/whatsapp/resolve'
import { aiResultSchema, type AiResult } from '@/lib/whatsapp/schema'
import { extractLancamento } from '@/lib/whatsapp/ai'
import { sendText } from '@/lib/whatsapp/evolution'
import {
  resolveContact,
  dedupeInbound,
  findPendingAction,
  upsertPendingAction,
  clearPendingAction,
} from '@/lib/whatsapp/service'
import {
  confirmacaoLancamento,
  perguntaDestino,
  perguntaCategoriaComOpcoes,
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

/** TTL curto da ação pendente (D-07): janela em que a resposta completa o lançamento. */
const PENDING_TTL_MIN = 15

// Campos da extração que persistimos no `partial` da pendência. É um subconjunto
// do AiResult — só o que precisamos para completar o lançamento depois.
type LancamentoCampos = Pick<
  AiResult,
  'tipo' | 'valorCents' | 'data' | 'categoria' | 'destino'
>

type EmpresaCtx = { id: string; nome: string }
type CategoriaCtx = { id: string; name: string; empresaId: string | null }

/**
 * Núcleo compartilhado entre o fluxo normal e o multi-turno: dado o conjunto de
 * campos extraídos (`campos`), resolve destino → categoria (regra Casa×Empresa,
 * CÓDIGO) e ou lança + confirma + limpa a pendência, ou grava a pendência parcial
 * e pergunta o que falta. SEMPRE envia uma resposta via sendText. Retorna um rótulo
 * para o payload 200 (observabilidade), nunca lança para o chamador.
 */
async function processarLancamento(
  campos: LancamentoCampos,
  deps: {
    phone: string
    userId: string
    empresas: EmpresaCtx[]
    categorias: CategoriaCtx[]
  }
): Promise<string> {
  const { phone, userId, empresas, categorias } = deps

  // (A) Destino — faltou/ambíguo → pendência ask_destino + pergunta (nunca adivinha).
  const destino = resolveDestino(campos.destino, empresas)
  if (!('empresaId' in destino)) {
    await upsertPendingAction({
      phone,
      kind: 'ask_destino',
      partial: campos,
      ttlMinutes: PENDING_TTL_MIN,
    })
    await sendText(phone, perguntaDestino())
    return 'ask_destino'
  }
  const empresaId = destino.empresaId

  // (B) Categoria — só casa com EXISTENTE do destino (D-04). Não casou → pendência
  // ask_categoria + pergunta oferecendo as categorias daquele destino (nunca cria).
  const categoriaRefs = categorias.map((c) => ({
    id: c.id,
    name: c.name,
    empresaId: c.empresaId,
  }))
  const categoria = resolveCategoria(campos.categoria, categoriaRefs, empresaId)
  if (!('categoryId' in categoria)) {
    const nomesDoDestino = categorias
      .filter((c) => c.empresaId === empresaId)
      .map((c) => c.name)
    await upsertPendingAction({
      phone,
      kind: 'ask_categoria',
      // guarda o destino já resolvido (como texto) para a próxima resposta completar
      partial: { ...campos, destino: campos.destino },
      ttlMinutes: PENDING_TTL_MIN,
    })
    await sendText(phone, perguntaCategoriaComOpcoes(nomesDoDestino))
    return 'ask_categoria'
  }
  const categoriaNome = categorias.find((c) => c.id === categoria.categoryId)?.name ?? ''

  // (C) Campos obrigatórios do lançamento ausentes (tipo/valor/data) → ajuda.
  if (!campos.tipo || !campos.valorCents || !campos.data) {
    await sendText(phone, ajuda())
    return 'ajuda'
  }

  // (D) Valida com o MESMO transactionSchema do form (W1) e lança (REUSO do service).
  const payload = {
    date: campos.data, // YYYY-MM-DD; o service faz parseISO (nunca Date à mão)
    description: categoriaNome, // AiResult não tem description → nome da categoria
    amountCents: campos.valorCents,
    type: campos.tipo,
    empresaId, // null = Casa (D-03)
    categoryId: categoria.categoryId, // categoria EXISTENTE (D-04)
  }
  const validated = transactionSchema.safeParse(payload)
  if (!validated.success) {
    await sendText(phone, ajuda())
    return 'ajuda'
  }

  await createTransactionService({ ...validated.data, userId })
  // Completou → limpa qualquer pendência deste número (idempotente).
  await clearPendingAction(phone)

  const destinoLabel = empresaId
    ? empresas.find((e) => e.id === empresaId)?.nome ?? 'Empresa'
    : 'Casa'
  await sendText(
    phone,
    confirmacaoLancamento(validated.data.amountCents, categoriaNome, destinoLabel)
  )
  return 'created'
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

    // (6) Contexto do usuário (empresas + categorias) — usado tanto pela IA quanto
    // pela resolução (regra Casa×Empresa). Carregado uma vez.
    const [empresas, categorias] = await Promise.all([
      getEmpresas(userId),
      getCategories(userId),
    ])
    const deps = { phone: msg.phone, userId, empresas, categorias }

    // (6a) Multi-turno (C-2): existe uma ação pendente VIVA deste número?
    // findPendingAction só retorna pendência com expiresAt > now — uma expirada
    // volta null e cai no fluxo normal (TTL evita sequestro — T-09-08).
    const pending = await findPendingAction(msg.phone)
    if (pending) {
      // A mensagem atual é a RESPOSTA: o texto preenche o campo que faltava.
      const partial = (pending.partial ?? {}) as LancamentoCampos
      const campos: LancamentoCampos =
        pending.kind === 'ask_categoria'
          ? { ...partial, categoria: msg.text } // resposta preenche a categoria
          : { ...partial, destino: msg.text } // ask_destino: resposta preenche o destino
      const handled = await processarLancamento(campos, deps)
      return ok({ handled, resumed: pending.kind })
    }

    // (7) Fluxo normal — extração estruturada (Claude Haiku).
    const ctx = {
      empresas: empresas.map((e) => e.nome), // W2: Empresa expõe `nome`
      categorias: categorias.map((c) => c.name), // Category expõe `name`
      hoje: new Date().toISOString().slice(0, 10),
    }
    const raw = await extractLancamento(msg.text, ctx)

    // (8) Valida o shape da IA com Zod — inválido → ajuda + 200.
    const parsed = aiResultSchema.safeParse(raw)
    if (!parsed.success) {
      await sendText(msg.phone, ajuda())
      return ok({ handled: 'ajuda' })
    }
    const ai = parsed.data

    // (9) Roteia por intent.
    if (ai.intent === 'relatorio') {
      await sendText(msg.phone, relatorioIndisponivel())
      return ok({ handled: 'relatorio' })
    }
    if (ai.intent !== 'lancar') {
      await sendText(msg.phone, ajuda())
      return ok({ handled: 'ajuda' })
    }

    // (10) intent === 'lancar' — resolve destino/categoria e lança OU pergunta
    // (persistindo a pendência). Núcleo compartilhado com o ramo multi-turno.
    const handled = await processarLancamento(
      {
        tipo: ai.tipo,
        valorCents: ai.valorCents,
        data: ai.data,
        categoria: ai.categoria,
        destino: ai.destino,
      },
      deps
    )
    return ok({ handled })
  } catch (error) {
    // Erro interno capturado: logar mensagem genérica (sem body/segredo — T-09-07)
    // e responder 200 para não disparar retry da Evolution. A dedupe cobre reentregas.
    console.error('[whatsapp webhook] erro ao processar mensagem:', (error as Error)?.message)
    return ok({ error: 'internal' })
  }
}
