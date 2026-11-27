// src/app/api/whatsapp/webhook/route.test.ts
// Teste de integração do Route Handler do webhook (09-02 Task 3). Mocka as
// fronteiras externas — IA (@/lib/whatsapp/ai), envio Evolution (@/lib/whatsapp/
// evolution), banco via service/loaders/createTransactionService — e verifica a
// orquestração: portas de segurança + caminho feliz. SEMPRE 200, nenhuma rede/DB real.
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks das fronteiras ------------------------------------------------
const aiMock = vi.hoisted(() => ({ extractLancamento: vi.fn() }))
const evolutionMock = vi.hoisted(() => ({ sendText: vi.fn() }))
const serviceMock = vi.hoisted(() => ({
  resolveContact: vi.fn(),
  dedupeInbound: vi.fn(),
  findPendingAction: vi.fn(),
  upsertPendingAction: vi.fn(),
  clearPendingAction: vi.fn(),
}))
const empresasLoaderMock = vi.hoisted(() => ({ getEmpresas: vi.fn() }))
const lancLoaderMock = vi.hoisted(() => ({ getCategories: vi.fn() }))
const lancServiceMock = vi.hoisted(() => ({ createTransactionService: vi.fn() }))

vi.mock('@/lib/whatsapp/ai', () => aiMock)
vi.mock('@/lib/whatsapp/evolution', () => evolutionMock)
vi.mock('@/lib/whatsapp/service', () => serviceMock)
vi.mock('@/app/(authed)/empresas/_lib/loader', () => empresasLoaderMock)
vi.mock('@/app/(authed)/lancamentos/_lib/loader', () => lancLoaderMock)
vi.mock('@/app/(authed)/lancamentos/_lib/service', () => lancServiceMock)

import { POST, runtime, dynamic } from './route'

const SECRET = 'segredo-teste'
const PHONE = '5511999999999'
const USER = 'user-1'

// Dados de contexto padrão: Casa tem a categoria "Gasolina"; a empresa "Achadinhos"
// tem a categoria "Vendas".
const CAT_CASA_GAS = { id: 'cat-casa-gas', name: 'Gasolina', empresaId: null }
const CAT_EMP_VENDAS = { id: 'cat-emp-vendas', name: 'Vendas', empresaId: 'emp-1' }
const EMPRESA = { id: 'emp-1', nome: 'Achadinhos' }

/** Monta um Request de webhook com o segredo no header e um payload Evolution. */
function webhookReq(body: unknown, { secret = SECRET }: { secret?: string } = {}) {
  return new Request('https://app.test/api/whatsapp/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
    body: JSON.stringify(body),
  })
}

/** Payload messages.upsert mínimo (texto simples). */
function upsert(text: string, overrides: Record<string, unknown> = {}) {
  return {
    data: {
      key: {
        remoteJid: `${PHONE}@s.whatsapp.net`,
        fromMe: false,
        id: 'MSG-1',
        ...(overrides.key as object),
      },
      pushName: 'Thaylan',
      message: { conversation: text },
      ...overrides,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.WHATSAPP_WEBHOOK_SECRET = SECRET

  // Defaults do caminho feliz (cada teste sobrescreve o que precisa).
  serviceMock.resolveContact.mockResolvedValue({ id: 'c1', phone: PHONE, userId: USER, active: true })
  serviceMock.dedupeInbound.mockResolvedValue({ duplicate: false })
  // Sem pendência viva por padrão (fluxo normal). Os testes multi-turno sobrescrevem.
  serviceMock.findPendingAction.mockResolvedValue(null)
  serviceMock.upsertPendingAction.mockResolvedValue({ id: 'p1' })
  serviceMock.clearPendingAction.mockResolvedValue({ count: 1 })
  empresasLoaderMock.getEmpresas.mockResolvedValue([EMPRESA])
  lancLoaderMock.getCategories.mockResolvedValue([CAT_CASA_GAS, CAT_EMP_VENDAS])
  lancServiceMock.createTransactionService.mockResolvedValue({ id: 'tx-1' })
  evolutionMock.sendText.mockResolvedValue(undefined)
})

describe('webhook route — exports', () => {
  it('declara runtime nodejs e dynamic force-dynamic', () => {
    expect(runtime).toBe('nodejs')
    expect(dynamic).toBe('force-dynamic')
  })
})

describe('webhook route — portas de segurança', () => {
  it('segredo inválido → 200 {ignored} sem chamar LLM nem service', async () => {
    const res = await POST(webhookReq(upsert('gastei 50 de gasolina na Casa'), { secret: 'errado' }))

    expect(res.status).toBe(200)
    expect(aiMock.extractLancamento).not.toHaveBeenCalled()
    expect(lancServiceMock.createTransactionService).not.toHaveBeenCalled()
  })

  it('fromMe:true → 200 ignore, sem LLM (economiza custo — T-09-03)', async () => {
    const res = await POST(webhookReq(upsert('eco do bot', { key: { fromMe: true } })))

    expect(res.status).toBe(200)
    expect(aiMock.extractLancamento).not.toHaveBeenCalled()
  })

  it('mensagem de grupo (@g.us) → 200 ignore, sem LLM', async () => {
    const res = await POST(
      webhookReq(upsert('oi grupo', { key: { remoteJid: '12036304@g.us' } }))
    )

    expect(res.status).toBe(200)
    expect(aiMock.extractLancamento).not.toHaveBeenCalled()
  })

  it('número fora da allowlist → 200 ignore, sem lançar (T-09-04)', async () => {
    serviceMock.resolveContact.mockResolvedValue(null)

    const res = await POST(webhookReq(upsert('gastei 50 de gasolina na Casa')))

    expect(res.status).toBe(200)
    expect(aiMock.extractLancamento).not.toHaveBeenCalled()
    expect(lancServiceMock.createTransactionService).not.toHaveBeenCalled()
  })

  it('messageId repetido (dedupe duplicate) → 200, NÃO lança segunda vez (C-3)', async () => {
    serviceMock.dedupeInbound.mockResolvedValue({ duplicate: true })

    const res = await POST(webhookReq(upsert('gastei 50 de gasolina na Casa')))

    expect(res.status).toBe(200)
    expect(aiMock.extractLancamento).not.toHaveBeenCalled()
    expect(lancServiceMock.createTransactionService).not.toHaveBeenCalled()
  })
})

describe('webhook route — caminho feliz (C-1)', () => {
  it('Casa: destino Casa + categoria existente → createTransactionService com empresaId null', async () => {
    aiMock.extractLancamento.mockResolvedValue({
      intent: 'lancar',
      tipo: 'SAIDA',
      valorCents: 5000,
      data: '2026-11-27',
      categoria: 'Gasolina',
      destino: 'Casa',
      confianca: 'alta',
    })

    const res = await POST(webhookReq(upsert('gastei 50 de gasolina na Casa')))

    expect(res.status).toBe(200)
    expect(lancServiceMock.createTransactionService).toHaveBeenCalledTimes(1)
    const arg = lancServiceMock.createTransactionService.mock.calls[0][0]
    expect(arg.empresaId).toBeNull()
    expect(arg.type).toBe('SAIDA')
    expect(arg.amountCents).toBe(5000)
    expect(arg.categoryId).toBe(CAT_CASA_GAS.id)
    expect(arg.description).toBe('Gasolina') // = nome da categoria resolvida
    expect(arg.date).toBe('2026-11-27')
    expect(arg.userId).toBe(USER)
    // confirmação enviada, formatada via formatBRL
    expect(evolutionMock.sendText).toHaveBeenCalledTimes(1)
    const [phone, text] = evolutionMock.sendText.mock.calls[0]
    expect(phone).toBe(PHONE)
    // formatBRL usa espaço não-quebrável (NBSP) entre "R$" e o número — normaliza.
    expect(text.replace(/ /g, ' ')).toContain('R$ 50,00')
    expect(text).toContain('Gasolina')
    expect(text).toContain('Casa')
  })

  it('empresa: destino = nome de empresa existente → empresaId daquela empresa', async () => {
    aiMock.extractLancamento.mockResolvedValue({
      intent: 'lancar',
      tipo: 'ENTRADA',
      valorCents: 12000,
      data: '2026-11-27',
      categoria: 'Vendas',
      destino: 'Achadinhos',
      confianca: 'alta',
    })

    const res = await POST(webhookReq(upsert('recebi 120 de vendas na Achadinhos')))

    expect(res.status).toBe(200)
    const arg = lancServiceMock.createTransactionService.mock.calls[0][0]
    expect(arg.empresaId).toBe('emp-1')
    expect(arg.categoryId).toBe(CAT_EMP_VENDAS.id)
    expect(arg.type).toBe('ENTRADA')
    const [, text] = evolutionMock.sendText.mock.calls[0]
    expect(text).toContain('Achadinhos')
  })
})

describe('webhook route — incerteza e roteamento (sem persistir — 09-03)', () => {
  it('destino faltando → pergunta + 200, sem lançar', async () => {
    aiMock.extractLancamento.mockResolvedValue({
      intent: 'lancar',
      tipo: 'SAIDA',
      valorCents: 5000,
      data: '2026-11-27',
      categoria: 'Gasolina',
      destino: '',
      confianca: 'media',
    })

    const res = await POST(webhookReq(upsert('gastei 50 de gasolina')))

    expect(res.status).toBe(200)
    expect(lancServiceMock.createTransactionService).not.toHaveBeenCalled()
    expect(evolutionMock.sendText).toHaveBeenCalledTimes(1)
  })

  it('categoria não resolvida → pergunta + 200, sem lançar', async () => {
    aiMock.extractLancamento.mockResolvedValue({
      intent: 'lancar',
      tipo: 'SAIDA',
      valorCents: 5000,
      data: '2026-11-27',
      categoria: 'inexistente',
      destino: 'Casa',
      confianca: 'media',
    })

    const res = await POST(webhookReq(upsert('gastei 50 de xpto na Casa')))

    expect(res.status).toBe(200)
    expect(lancServiceMock.createTransactionService).not.toHaveBeenCalled()
    expect(evolutionMock.sendText).toHaveBeenCalledTimes(1)
  })

  it('intent relatorio → responde indisponível + 200, sem lançar', async () => {
    aiMock.extractLancamento.mockResolvedValue({ intent: 'relatorio', confianca: 'alta' })

    const res = await POST(webhookReq(upsert('quanto gastei esse mês?')))

    expect(res.status).toBe(200)
    expect(lancServiceMock.createTransactionService).not.toHaveBeenCalled()
    expect(evolutionMock.sendText).toHaveBeenCalledTimes(1)
  })

  it('erro interno da IA capturado → ainda responde 200 (não dispara retry da Evolution)', async () => {
    aiMock.extractLancamento.mockRejectedValue(new Error('LLM caiu'))

    const res = await POST(webhookReq(upsert('gastei 50 de gasolina na Casa')))

    expect(res.status).toBe(200)
    expect(lancServiceMock.createTransactionService).not.toHaveBeenCalled()
  })
})

describe('webhook route — multi-turno (C-2: na dúvida, pergunta e completa)', () => {
  it('falta destino → NÃO lança; grava pendência ask_destino com a extração parcial e pergunta', async () => {
    aiMock.extractLancamento.mockResolvedValue({
      intent: 'lancar',
      tipo: 'SAIDA',
      valorCents: 5000,
      data: '2026-11-27',
      categoria: 'Gasolina',
      destino: '', // destino não dito → faltou
      confianca: 'media',
    })

    const res = await POST(webhookReq(upsert('gastei 50 de gasolina')))

    expect(res.status).toBe(200)
    expect(lancServiceMock.createTransactionService).not.toHaveBeenCalled()
    // persiste a pendência parcial (kind ask_destino) com o que já foi extraído
    expect(serviceMock.upsertPendingAction).toHaveBeenCalledTimes(1)
    const arg = serviceMock.upsertPendingAction.mock.calls[0][0]
    expect(arg.phone).toBe(PHONE)
    expect(arg.kind).toBe('ask_destino')
    expect(arg.partial).toMatchObject({ valorCents: 5000, categoria: 'Gasolina', tipo: 'SAIDA' })
    expect(typeof arg.ttlMinutes).toBe('number')
    // pergunta de destino enviada
    expect(evolutionMock.sendText).toHaveBeenCalledTimes(1)
    const [, text] = evolutionMock.sendText.mock.calls[0]
    expect(text).toContain('Casa')
  })

  it('pendência ask_destino viva + resposta "Casa" → merge, lança, limpa a pendência e confirma', async () => {
    // Não chama a IA quando há pendência viva — a mensagem É a resposta.
    serviceMock.findPendingAction.mockResolvedValue({
      id: 'p1',
      phone: PHONE,
      kind: 'ask_destino',
      partial: { tipo: 'SAIDA', valorCents: 5000, data: '2026-11-27', categoria: 'Gasolina' },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    const res = await POST(webhookReq(upsert('Casa')))

    expect(res.status).toBe(200)
    // a IA NÃO deve ser chamada (a resposta completa a pendência)
    expect(aiMock.extractLancamento).not.toHaveBeenCalled()
    // lança com o destino respondido (Casa → empresaId null) + categoria do partial
    expect(lancServiceMock.createTransactionService).toHaveBeenCalledTimes(1)
    const arg = lancServiceMock.createTransactionService.mock.calls[0][0]
    expect(arg.empresaId).toBeNull()
    expect(arg.categoryId).toBe(CAT_CASA_GAS.id)
    expect(arg.amountCents).toBe(5000)
    expect(arg.type).toBe('SAIDA')
    expect(arg.userId).toBe(USER)
    // limpa a pendência e confirma
    expect(serviceMock.clearPendingAction).toHaveBeenCalledWith(PHONE)
    expect(evolutionMock.sendText).toHaveBeenCalledTimes(1)
    const [, text] = evolutionMock.sendText.mock.calls[0]
    // formatBRL usa NBSP entre "R$" e o número — normaliza qualquer espaço.
    expect(text.replace(/\s/g, ' ')).toContain('R$ 50,00')
    expect(text).toContain('Casa')
  })

  it('categoria não casa → NÃO cria categoria; grava pendência ask_categoria e oferece as categorias do destino (D-04)', async () => {
    aiMock.extractLancamento.mockResolvedValue({
      intent: 'lancar',
      tipo: 'SAIDA',
      valorCents: 5000,
      data: '2026-11-27',
      categoria: 'xpto-inexistente',
      destino: 'Casa',
      confianca: 'media',
    })

    const res = await POST(webhookReq(upsert('gastei 50 de xpto na Casa')))

    expect(res.status).toBe(200)
    expect(lancServiceMock.createTransactionService).not.toHaveBeenCalled()
    // persiste pendência ask_categoria com o destino já resolvido no partial
    expect(serviceMock.upsertPendingAction).toHaveBeenCalledTimes(1)
    const arg = serviceMock.upsertPendingAction.mock.calls[0][0]
    expect(arg.kind).toBe('ask_categoria')
    expect(arg.partial).toMatchObject({ valorCents: 5000, destino: 'Casa' })
    // a pergunta oferece as categorias EXISTENTES daquele destino (Casa → "Gasolina")
    expect(evolutionMock.sendText).toHaveBeenCalledTimes(1)
    const [, text] = evolutionMock.sendText.mock.calls[0]
    expect(text).toContain('Gasolina')
  })

  it('pendência ask_categoria viva + resposta "Gasolina" → lança e limpa a pendência', async () => {
    serviceMock.findPendingAction.mockResolvedValue({
      id: 'p2',
      phone: PHONE,
      kind: 'ask_categoria',
      // destino já resolvido antes (Casa); só falta a categoria
      partial: { tipo: 'SAIDA', valorCents: 5000, data: '2026-11-27', destino: 'Casa' },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })

    const res = await POST(webhookReq(upsert('Gasolina')))

    expect(res.status).toBe(200)
    expect(aiMock.extractLancamento).not.toHaveBeenCalled()
    expect(lancServiceMock.createTransactionService).toHaveBeenCalledTimes(1)
    const arg = lancServiceMock.createTransactionService.mock.calls[0][0]
    expect(arg.empresaId).toBeNull()
    expect(arg.categoryId).toBe(CAT_CASA_GAS.id)
    expect(serviceMock.clearPendingAction).toHaveBeenCalledWith(PHONE)
    expect(evolutionMock.sendText).toHaveBeenCalledTimes(1)
  })

  it('TTL: pendência expirada é ignorada (findPendingAction → null) → trata como nova extração', async () => {
    // findPendingAction já filtra por expiresAt > now; expirada volta null.
    serviceMock.findPendingAction.mockResolvedValue(null)
    aiMock.extractLancamento.mockResolvedValue({
      intent: 'lancar',
      tipo: 'SAIDA',
      valorCents: 5000,
      data: '2026-11-27',
      categoria: 'Gasolina',
      destino: 'Casa',
      confianca: 'alta',
    })

    const res = await POST(webhookReq(upsert('gastei 50 de gasolina na Casa')))

    expect(res.status).toBe(200)
    // nova extração: a IA É chamada (não tratada como resposta de pendência)
    expect(aiMock.extractLancamento).toHaveBeenCalledTimes(1)
    expect(lancServiceMock.createTransactionService).toHaveBeenCalledTimes(1)
  })
})
