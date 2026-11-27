// src/lib/whatsapp/ai.ts
// Camada isolada de extração estruturada (D-05): texto PT-BR → objeto do tool via
// Claude Haiku (tool use FORÇADO com tool_choice:{type:'tool'}). Devolve o input
// cru do tool_use para o CHAMADOR validar com aiResultSchema (Zod) — a regra de
// negócio Casa×Empresa NÃO vive aqui (T-09-06). O cliente Anthropic é injetável
// (parâmetro opcional) para testar sem rede; no runtime lê ANTHROPIC_API_KEY do
// ambiente. Haiku NÃO suporta effort/thinking — não enviamos nenhum.
import Anthropic from '@anthropic-ai/sdk'

/** Contexto do usuário passado ao modelo (nomes já mapeados — W2). */
export interface AiContext {
  empresas: string[]
  categorias: string[]
  hoje: string // YYYY-MM-DD
}

/** Cliente mínimo que `extractLancamento` precisa — permite stub nos testes. */
export interface AnthropicLike {
  messages: {
    create: (args: unknown) => Promise<{ content: Array<{ type: string; input?: unknown }> }>
  }
}

const LANCAMENTO_TOOL = {
  name: 'registrar_lancamento',
  description: 'Extrai a intenção financeira de uma frase em português do Brasil.',
  input_schema: {
    type: 'object' as const,
    properties: {
      intent: { type: 'string', enum: ['lancar', 'relatorio', 'esclarecer', 'ajuda'] },
      tipo: { type: 'string', enum: ['ENTRADA', 'SAIDA'] },
      valorCents: {
        type: 'integer',
        description: 'valor em centavos, ex.: 5000 = R$ 50,00',
      },
      data: { type: 'string', description: 'YYYY-MM-DD; use a data de hoje se não dito' },
      categoria: { type: 'string', description: 'nome falado da categoria, ex.: gasolina' },
      destino: {
        type: 'string',
        description: 'Casa, ou o nome da empresa dito; vazio se não ficar claro',
      },
      confianca: { type: 'string', enum: ['alta', 'media', 'baixa'] },
    },
    required: ['intent', 'confianca'],
    additionalProperties: false,
  },
}

function buildSystem(ctx: AiContext): string {
  const empresas = ctx.empresas.join(', ') || '(nenhuma)'
  const categorias = ctx.categorias.join(', ') || '(nenhuma)'
  return (
    `Hoje é ${ctx.hoje}. Empresas do usuário: ${empresas}. ` +
    `Categorias disponíveis: ${categorias}. ` +
    `Separe sempre a Casa (orçamento doméstico) da Empresa. ` +
    `Se o destino (Casa ou qual empresa) não ficar claro, deixe "destino" vazio — NÃO adivinhe. ` +
    `Datas sempre no formato YYYY-MM-DD; valores sempre em centavos (inteiro).`
  )
}

/**
 * Extrai a intenção da frase `text` usando o tool forçado. Retorna o `input` cru
 * do bloco tool_use (o chamador valida com aiResultSchema). Lança se o modelo não
 * devolver nenhum bloco tool_use. `client` é injetável para testes offline.
 */
export async function extractLancamento(
  text: string,
  ctx: AiContext,
  client?: AnthropicLike
): Promise<unknown> {
  const anthropic: AnthropicLike = client ?? (new Anthropic() as unknown as AnthropicLike)

  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    tools: [LANCAMENTO_TOOL],
    tool_choice: { type: 'tool', name: 'registrar_lancamento' },
    system: buildSystem(ctx),
    messages: [{ role: 'user', content: text }],
  })

  const toolUse = res.content.find((b) => b.type === 'tool_use')
  if (!toolUse) {
    throw new Error('IA não retornou extração estruturada')
  }
  return toolUse.input
}
