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
