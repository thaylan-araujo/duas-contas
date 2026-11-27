// src/lib/whatsapp/ai.test.ts
// Seams externos da Fatia 1 (09-02 Task 1): extração estruturada via Claude Haiku
// (cliente Anthropic MOCKADO — nenhuma rede), verificação do segredo do webhook
// (constant-time) e envio de texto pela Evolution (fetch MOCKADO). Todo o teste é
// offline: injetamos stubs. Nenhuma ANTHROPIC/EVOLUTION key é tocada.
import { describe, it, expect, vi } from 'vitest'
import { extractLancamento } from './ai'
import { verifyWebhookSecret } from './security'
import { sendText } from './evolution'

// --- ai.ts: extractLancamento --------------------------------------------

/** Monta um client Anthropic falso cujo messages.create devolve `content`. */
function fakeClient(content: unknown[]) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({ content }),
    },
  }
}

const CTX = { empresas: ['Achadinhos'], categorias: ['Gasolina'], hoje: '2026-11-27' }

describe('extractLancamento', () => {
  it('retorna o input cru do bloco tool_use quando presente', async () => {
    const input = { intent: 'lancar', tipo: 'SAIDA', valorCents: 5000, confianca: 'alta' }
    const client = fakeClient([{ type: 'tool_use', name: 'registrar_lancamento', input }])

    const result = await extractLancamento('gastei 50 de gasolina na casa', CTX, client)

    expect(result).toEqual(input)
  })

  it('lança quando a resposta não contém bloco tool_use', async () => {
    const client = fakeClient([{ type: 'text', text: 'oi' }])

    await expect(extractLancamento('oi', CTX, client)).rejects.toThrow(
      'IA não retornou extração estruturada'
    )
  })

  it('não toca a rede — usa o client injetado e passa model/tools/tool_choice', async () => {
    const client = fakeClient([
      { type: 'tool_use', name: 'registrar_lancamento', input: { intent: 'ajuda', confianca: 'baixa' } },
    ])

    await extractLancamento('ajuda', CTX, client)

    expect(client.messages.create).toHaveBeenCalledTimes(1)
    const arg = client.messages.create.mock.calls[0][0]
    expect(arg.model).toBe('claude-haiku-4-5')
    expect(arg.tool_choice).toEqual({ type: 'tool', name: 'registrar_lancamento' })
    expect(Array.isArray(arg.tools)).toBe(true)
    // Haiku não suporta effort/thinking — não devem ser enviados.
    expect(arg.effort).toBeUndefined()
    expect(arg.thinking).toBeUndefined()
    // O contexto (hoje/empresas/categorias) vai no system prompt.
    expect(arg.system).toContain('2026-11-27')
    expect(arg.system).toContain('Achadinhos')
    expect(arg.system).toContain('Gasolina')
  })
})

// --- security.ts: verifyWebhookSecret ------------------------------------

function reqWithHeader(secret: string) {
  return new Request('https://app.test/api/whatsapp/webhook', {
    headers: { 'x-webhook-secret': secret },
  })
}
function reqWithQuery(secret: string) {
  return new Request(`https://app.test/api/whatsapp/webhook?secret=${encodeURIComponent(secret)}`)
}
function reqBare() {
  return new Request('https://app.test/api/whatsapp/webhook')
}

describe('verifyWebhookSecret', () => {
  const EXPECTED = 'segredo-super-secreto'

  it('aceita o segredo correto via header x-webhook-secret', () => {
    expect(verifyWebhookSecret(reqWithHeader(EXPECTED), EXPECTED)).toBe(true)
  })

  it('aceita o segredo correto via query ?secret=', () => {
    expect(verifyWebhookSecret(reqWithQuery(EXPECTED), EXPECTED)).toBe(true)
  })

  it('rejeita segredo errado', () => {
    expect(verifyWebhookSecret(reqWithHeader('errado'), EXPECTED)).toBe(false)
    expect(verifyWebhookSecret(reqWithQuery('errado'), EXPECTED)).toBe(false)
  })

  it('rejeita quando o segredo está ausente', () => {
    expect(verifyWebhookSecret(reqBare(), EXPECTED)).toBe(false)
  })

  it('rejeita quando o esperado não está configurado', () => {
    expect(verifyWebhookSecret(reqWithHeader('x'), '')).toBe(false)
    expect(verifyWebhookSecret(reqWithHeader('x'), undefined)).toBe(false)
  })
})

// --- evolution.ts: sendText ----------------------------------------------

describe('sendText', () => {
  it('monta URL/headers/body corretos via fetch injetável', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })

    await sendText('5511999999999', '✓ R$ 50,00 · Gasolina · Casa', {
      fetchFn: fetchMock,
      baseUrl: 'https://evo.test',
      instance: 'minha-instancia',
      apiKey: 'chave-evo',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://evo.test/message/sendText/minha-instancia')
    expect(init.method).toBe('POST')
    expect(init.headers.apikey).toBe('chave-evo')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({
      number: '5511999999999',
      text: '✓ R$ 50,00 · Gasolina · Casa',
    })
  })
})
