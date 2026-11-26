# Phase 9 · Fatia 1 — WhatsApp: Texto → lançar (núcleo) — Research

**Researched:** 2026-11-26
**Domain:** Inbound WhatsApp webhook (Evolution API) → LLM structured extraction (Anthropic Haiku) → Casa×Empresa routing → reuse existing lançamento service → reply via REST. Serverless on Vercel (Next.js 15 App Router Route Handler + Prisma/Supabase).
**Confidence:** HIGH on the repo integration path (read from code) and Anthropic SDK (authoritative skill); MEDIUM on exact Evolution API payload field paths (official docs + real GitHub payloads, but version-sensitive).

## Summary

Esta fatia é uma **pipeline server-side** sem UI nova: um Route Handler `POST /api/whatsapp/webhook` recebe o evento `messages.upsert` da Evolution API, valida segredo + allowlist, deduplica por id de mensagem, extrai o texto, chama o Claude Haiku para produzir um objeto estruturado (tool use) validado por **Zod**, resolve destino (Casa `empresaId=null` ou empresa por match tolerante) e categoria (só existentes), e — se tudo claro — chama **`createTransactionService`** (que já é uma função pura que aceita `userId` explícito; **nenhum refactor necessário**) e responde via `POST /message/sendText/{instance}`. Quando falta destino/categoria, grava uma **ação pendente** no Postgres e pergunta; a próxima mensagem completa.

O caminho de criação de lançamento **já está pronto para reuso**: `src/app/(authed)/lancamentos/_lib/service.ts` separa a lógica pura (service, sem `'use server'`, recebe `userId`) do `actions.ts` (que faz `getUserId()` da sessão). O webhook ignora `actions.ts` e chama o service direto — exatamente o padrão D-02. O Anthropic SDK **não está instalado**; `zod` já está (`^3.25.76`). Três tabelas aditivas novas (`WhatsappContact`, `WhatsappInbound`, `WhatsappPendingAction`) — migração aditiva com DIRECT_URL, backup antes.

**Primary recommendation:** Route Handler Node.js runtime (não edge), processamento **inline** (volume baixo — ack+200 ao final cabe no tempo da função), extração via `client.messages.create` com `tools` + `tool_choice:{type:'tool'}` no modelo `claude-haiku-4-5`, validação Zod do `tool_use.input`, dedupe por `@@unique(messageId)` com erro de constraint = "já processado", e reuso direto de `createTransactionService({...parsed, userId})`. Toda a lógica pura (extração→mapeamento, resolução destino/categoria, parsing do payload) em funções testáveis com Vitest.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (abordagem):** webhook no próprio app Next.js (Vercel), **não** n8n nem micro-serviço — a regra inviolável Casa × Empresa fica em código TS tipado/testável reusando os services existentes.
- **D-02 (identidade):** app ainda é single-user. Número autorizado → único usuário existente via linha `WhatsappContact` criada no setup (sem tela de cadastro). Webhook é **chamador server-side confiável**: resolve `userId` pela allowlist e chama o service direto (sem sessão/cookie).
- **D-03 (destino):** Casa é destino de primeira classe (`empresaId = null`), distinto de "não informado". Na dúvida, pergunta — nunca adivinha (anti-objetivo nº 1).
- **D-04 (categoria):** só categorias existentes; sem criação por chat nesta fase; `kind` inferido.
- **D-05 (IA):** Claude Haiku via Anthropic SDK, saída estruturada (tool use) validada por Zod. Camada isolada (trocável de provedor depois). Base = spike de 26/11 (texto validado).
- **D-06 (segurança/idempotência):** segredo do webhook + allowlist; dedupe por id de mensagem.
- **D-07 (estado):** ação pendente multi-turno persistida no Postgres (serverless não guarda memória).

### Claude's Discretion
- Formato exato do payload da Evolution (ler da instância real) e extração de texto/remetente.
- Match tolerante de categoria/empresa e quando perguntar.
- Esquema fino das tabelas novas (`WhatsappContact`, `WhatsappInbound`, `WhatsappPendingAction`) e TTL.
- Processar inline × responder ack e processar (conforme tempo real da função).
- Prompt e formato de saída estruturada do Claude.
- Textos exatos das respostas do bot (curto, PT-BR, R$/datas no padrão).

### Deferred Ideas (OUT OF SCOPE)
Pró-labore por chat (Fatia 2), relatórios (Fatia 3), OCR de cupom (Fatia 4), áudio (Fatia 5),
Open Finance, multiusuário/família no WhatsApp, agenda/tarefas/notas como novos ramos do roteador.
</user_constraints>

<phase_requirements>
## Phase Requirements

Nenhum ID formal mapeado (critérios descritivos na ROADMAP Phase 9). Critérios desta fatia:

| ID | Description | Research Support |
|----|-------------|------------------|
| C-1 | Criar lançamento no destino certo (Casa/empresa) + confirmar por mensagem | `createTransactionService` reusável (§Reuse); `sendText` REST (§Evolution); formatBRL/formatDate (§Code Examples) |
| C-2 | Perguntar quando destino/categoria incertos (nunca adivinha) | Ação pendente no Postgres (§Idempotency+State); gate de confiança (§Resolving destino/categoria) |
| C-3 | Allowlist de número + idempotência por id de mensagem | `WhatsappContact` allowlist + `WhatsappInbound` `@@unique(messageId)` (§Idempotency); segredo compartilhado (§Security Domain) |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Receber evento WhatsApp | API / Backend (Route Handler Node runtime) | — | Precisa de Prisma (não roda em edge); é o único entrypoint server-side confiável |
| Validar segredo + allowlist | API / Backend | Database (consulta `WhatsappContact`) | Autenticação deste canal = resolução por allowlist (D-02) |
| Dedupe de mensagem | Database (unique constraint) | API | Serverless não guarda estado; a garantia tem que ser do banco |
| Extração estruturada (LLM) | API → Anthropic (server tool) | — | Camada isolada `src/lib/whatsapp/ai.ts`, trocável de provedor (D-05) |
| Resolver destino/categoria | API / Backend (função pura) | Database (loaders de empresa/categoria) | Regra Casa×Empresa é código TS testável (D-01) |
| Criar lançamento | API / Backend (`createTransactionService`) | Database (Prisma) | Reusa service existente; `userId` injetado (D-02) |
| Estado multi-turno | Database (`WhatsappPendingAction`) | API | Serverless é stateless (D-07) |
| Responder | API → Evolution REST (`sendText`) | — | Canal é o WhatsApp, não uma tela |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@anthropic-ai/sdk` | `1.14.0` (verificado npm 2026-11-26) | Cliente Anthropic (Haiku) + tool use estruturado | SDK oficial Anthropic; 73M downloads/semana; repo `anthropics/anthropic-sdk-typescript`. **Instalar** (ainda não está no projeto). `[VERIFIED: npm registry + claude-api skill]` |
| `zod` | `^3.25.76` (já instalado) | Validação do `tool_use.input` do Claude | Já é o padrão do projeto (schema.ts de lançamentos). `[VERIFIED: codebase package.json]` |
| `@prisma/client` | `^6.19.3` (já instalado) | Queries/mutations + novas tabelas | Já é o ORM; `createTransactionService` já usa. `[VERIFIED: codebase]` |
| `next` | `^15.5.28` (já instalado) | Route Handler `app/api/.../route.ts` | App Router já em uso; `app/api/health/route.ts` é o precedente. `[VERIFIED: codebase]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | `^3.6.0` (já instalado) | Parse de datas relativas ("ontem") no lado do service/mapeamento; formatação PT-BR nas respostas | Já usado em `format.ts`/`service.ts` (`parseISO`). `[VERIFIED: codebase]` |
| `node:crypto` (built-in) | — | `timingSafeEqual` para comparar segredo do webhook; `randomUUID` | `crypto.randomUUID()` já é usado em `service.ts`. Nenhuma dependência nova. `[VERIFIED: codebase]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Claude Haiku via SDK (D-05) | OpenAI/Gemini | Fora do escopo — decisão travada; camada `ai.ts` deixa trocável depois |
| Processar inline | Ack imediato + background (QStash/queue) | Volume baixo (uso pessoal) não justifica fila; inline é mais simples e cabe no timeout. Reavaliar se latência real do LLM > ~8s |
| Zod no `tool_use.input` | `strict: true` no tool + confiar | Zod é o padrão do repo e dá mensagem PT-BR; `strict:true` pode complementar mas não substitui a validação de regra de negócio |

**Installation:**
```bash
npm install @anthropic-ai/sdk
```

**Version verification:** `npm view @anthropic-ai/sdk version` → `1.14.0` (publicado 2026-11-24). Sem `postinstall`. `zod`, `@prisma/client`, `next`, `date-fns` já presentes — não reinstalar.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@anthropic-ai/sdk` | npm | mirror republicado 2026-11-24 | ~73,6M/semana | github.com/anthropics/anthropic-sdk-typescript | SUS (motivo único: `too-new`) | **Approved** — falso positivo |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `@anthropic-ai/sdk` — o seam marcou `too-new` porque **todo** o espelho npm desta sessão tem `publishedAt` 2026-11-24 (artefato do ambiente, não do pacote). Sinais reais: 73,6M downloads/semana, repo oficial Anthropic, sem postinstall, não deprecado, e é o SDK citado pela skill `claude-api` oficial. **Tratar como OK.** O planner pode pular o checkpoint humano para este pacote específico (é o SDK canônico da Anthropic), mas se quiser rigor, um único `checkpoint:human-verify` antes do `npm install` é aceitável.

## Architecture Patterns

### System Architecture Diagram

```
WhatsApp (número do bot)
   │  (usuário manda "gastei 50 de gasolina na casa")
   ▼
Evolution API (VPS, Docker)
   │  webhook POST (event=messages.upsert) + ?apikey/segredo
   ▼
POST /api/whatsapp/webhook   ── Next.js Route Handler (runtime = 'nodejs') ──────────────┐
   │                                                                                      │
   │ 1. verifySecret(req)  ── timingSafeEqual(header/query, WHATSAPP_WEBHOOK_SECRET)      │
   │       └─ falha → 200 {ignored:true}  (não vaza; não reprocessa)                      │
   │ 2. parsePayload(body) ── extrai {remoteJid, fromMe, messageId, pushName, text}       │
   │       └─ fromMe==true  → 200 ignore (não ecoar o próprio bot)                        │
   │       └─ remoteJid termina em @g.us → 200 ignore (grupo, fora do escopo)             │
   │ 3. resolveContact(phone) ── WhatsappContact ativo? → userId  |  senão 200 ignore     │
   │ 4. dedupe(messageId)   ── insert WhatsappInbound; unique violation → 200 (já feito)  │
   │ 5. pending = findPendingAction(phone não-expirada)                                   │
   │       ├─ existe → merge resposta na extração parcial                                 │
   │       └─ não   → aiExtract(text, {empresas, categorias})  (Claude Haiku, tool use)   │
   │ 6. Zod.parse(tool_use.input) → {intent, tipo, valorCents, data, categoria, destino…} │
   │ 7. route(intent):                                                                    │
   │      ├─ 'lancar'      → resolveDestino → resolveCategoria                             │
   │      │     ├─ claro   → createTransactionService({...}, userId) → confirma ✓         │
   │      │     └─ falta X → upsert WhatsappPendingAction(payload parcial, TTL) → pergunta │
   │      ├─ 'relatorio'   → responde "relatórios chegam numa próxima atualização"        │
   │      └─ 'ajuda'/outro → texto de ajuda curto                                         │
   │ 8. sendText(phone, mensagem)  ── POST {EVOLUTION_API_URL}/message/sendText/{inst}    │
   │                                   header apikey                                       │
   └──────────────────────────────── return 200 ────────────────────────────────────────┘
```

A regra Casa×Empresa vive **inteiramente** em passos 6–7 (código TS puro, testável). A Evolution e o Claude são fronteiras externas mockáveis.

### Component Responsibilities
| File (proposto) | Responsibility |
|-----------------|----------------|
| `src/app/api/whatsapp/webhook/route.ts` | `export const runtime = 'nodejs'`; orquestra 1–8; sempre retorna 200 |
| `src/lib/whatsapp/parse.ts` | `parseInbound(body)` → `{remoteJid, phone, fromMe, isGroup, messageId, pushName, text}` (função pura) |
| `src/lib/whatsapp/ai.ts` | `extractLancamento(text, ctx)` → chama Claude, retorna `tool_use.input` cru (camada isolada de provedor) |
| `src/lib/whatsapp/schema.ts` | Zod do resultado da IA (`intent`, `tipo`, `valorCents`, `data`, `categoria`, `destino`, `confianca`) |
| `src/lib/whatsapp/resolve.ts` | `resolveDestino(nome, empresas)` / `resolveCategoria(nome, categorias, destino)` (puro, match tolerante) |
| `src/lib/whatsapp/evolution.ts` | `sendText(phone, text)` — wrapper REST |
| `src/lib/whatsapp/service.ts` | dedupe / pending-action helpers (Prisma) |
| `src/lib/whatsapp/messages.ts` | textos PT-BR das respostas (formatBRL/formatDate) |

### Pattern 1: Route Handler como webhook no runtime Node.js
**What:** Handler POST que corre no runtime Node (não edge) porque usa Prisma.
**When to use:** Todo webhook que toca o banco neste projeto.
**Example:**
```typescript
// Source: Next.js App Router Route Handlers + repo app/api/health/route.ts
// src/app/api/whatsapp/webhook/route.ts
export const runtime = 'nodejs'        // Prisma não roda em edge
export const dynamic = 'force-dynamic' // nunca cachear um webhook

export async function POST(req: Request) {
  // 1. segredo
  if (!verifyWebhookSecret(req)) {
    return Response.json({ ignored: true }, { status: 200 }) // não revela; não reenfileira
  }
  const body = await req.json()
  // ... passos 2–8 ...
  return Response.json({ ok: true }, { status: 200 })
}
```
> **Responder 200 quase sempre.** Um 4xx/5xx faz a Evolution reentregar (retry), causando reprocessamento. Em erro interno capturado, logue e responda 200 — a idempotência + o "já processado" cobrem reentregas legítimas. Só situações realmente retryáveis (ex.: LLM 529) justificam deixar o retry acontecer, e aí a dedupe protege.

### Pattern 2: Extração estruturada via tool use (forçado)
**What:** Forçar o Claude a devolver JSON no shape do tool, em vez de texto livre.
**Example:**
```typescript
// Source: claude-api skill (shared/tool-use-concepts.md — tool_choice)
// src/lib/whatsapp/ai.ts
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic() // lê ANTHROPIC_API_KEY do ambiente

const LANCAMENTO_TOOL = {
  name: 'registrar_lancamento',
  description: 'Extrai a intenção financeira de uma frase em português do Brasil.',
  input_schema: {
    type: 'object',
    properties: {
      intent:   { type: 'string', enum: ['lancar','relatorio','esclarecer','ajuda'] },
      tipo:     { type: 'string', enum: ['ENTRADA','SAIDA'] },
      valorCents: { type: 'integer', description: 'valor em centavos, ex.: 5000 = R$ 50,00' },
      data:     { type: 'string', description: 'YYYY-MM-DD; use a data de hoje se não dito' },
      categoria:{ type: 'string', description: 'nome falado da categoria, ex.: gasolina' },
      destino:  { type: 'string', description: 'Casa, ou o nome da empresa dito; vazio se não dito' },
      confianca:{ type: 'string', enum: ['alta','media','baixa'] },
    },
    required: ['intent','confianca'],
    additionalProperties: false,
  },
  strict: true, // garante input válido no shape; a regra de negócio ainda é checada por Zod
} as const

export async function extractLancamento(text: string, ctx: { empresas: string[]; categorias: string[]; hoje: string }) {
  const res = await client.messages.create({
    model: 'claude-haiku-4-5',  // [CITED: claude-api skill shared/models.md]
    max_tokens: 1024,
    tools: [LANCAMENTO_TOOL],
    tool_choice: { type: 'tool', name: 'registrar_lancamento' }, // força o uso do tool
    system: `Hoje é ${ctx.hoje}. Empresas do usuário: ${ctx.empresas.join(', ') || '(nenhuma)'}. ` +
            `Categorias disponíveis: ${ctx.categorias.join(', ')}. ` +
            `Se o destino (Casa ou qual empresa) não ficar claro, deixe "destino" vazio — NÃO adivinhe.`,
    messages: [{ role: 'user', content: text }],
  })
  const toolUse = res.content.find((b) => b.type === 'tool_use')
  if (!toolUse) throw new Error('IA não retornou extração estruturada')
  return toolUse.input // validar com Zod no chamador
}
```
> Modelo: use `claude-haiku-4-5` (alias). A skill confirma que o alias é completo; o id datado `claude-haiku-4-5-20251001` também é válido mas o alias é preferível. `[CITED: claude-api skill → shared/models.md]`
> Thinking/effort: Haiku **não** suporta `effort`/`budget_tokens` — não passe nenhum. `[CITED: claude-api skill]`
> Custo: Haiku = **$1,00/MTok entrada, $5,00/MTok saída** `[CITED: claude-api skill shared/models.md]`. Uma frase curta (~400 tokens system+contexto + ~150 saída) custa fração de centavo — ordem de ~US$0,0007/mensagem `[ASSUMED]` (estimativa; confirmar com `response.usage` real).

### Anti-Patterns to Avoid
- **Edge runtime no webhook:** Prisma não roda em edge → erro em runtime. Declare `runtime = 'nodejs'`.
- **Confiar só no `strict:true` do tool:** garante o *shape*, não a *regra*. Zod + checagem "destino existe?" é obrigatória antes de lançar.
- **Responder 4xx em erro de negócio:** causa retry da Evolution. Responda 200 e trate internamente.
- **Adivinhar destino:** anti-objetivo nº 1. `destino` vazio ou `confianca:'baixa'` → pergunta.
- **Instanciar `new PrismaClient()` novo no webhook:** use o singleton `@/lib/prisma`.
- **Criar categoria nova por chat:** proibido nesta fatia (D-04).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Criar lançamento | Lógica Prisma própria no webhook | `createTransactionService({...data, userId})` | Já existe, tipado, com `parseISO` anti-timezone (§Reuse) |
| Extração NL→JSON | Regex/parser de valores/datas | Claude tool use | Spike de 26/11 já validou PT-BR; regex quebra em "cinquenta reais", "ontem", multi-item |
| Formatar R$/data | `toLocaleString` inline | `formatBRL`/`formatDate` de `@/lib/format` | Regra do projeto: "NEVER format inline" |
| Comparar segredo | `a === b` | `crypto.timingSafeEqual` | Evita timing attack na comparação do segredo (ASVS) |
| Idempotência | `Set` em memória | `@@unique(messageId)` + capturar violação | Serverless não guarda memória entre invocações (D-07) |
| Validar shape da IA | checar `typeof` à mão | Zod | Padrão do repo; mensagens PT-BR; `safeParse` |

**Key insight:** O valor desta fatia é a **cola** (webhook→IA→regra→service), não reconstruir peças. A peça mais arriscada — criar lançamento respeitando Casa×Empresa — já está pronta e testada; o webhook só precisa chamá-la com o `userId` certo e o destino certo.

## Runtime State Inventory

> Greenfield (adição de tabelas + endpoint novo). Sem renomeação/migração de dados existentes. Categoria verificada:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Nenhum dado existente é renomeado. Serão **criadas** 3 tabelas novas (migração aditiva). | Migração aditiva: `prisma migrate dev` com DIRECT_URL (porta 5432), backup antes (CLAUDE.md). Nunca shadow-db no banco real. |
| Live service config | A **instância Evolution** (na VPS) precisa ter o webhook apontado para `{URL}/api/whatsapp/webhook` com o segredo — config vive na Evolution, não no git. | Pré-requisito externo do Thaylan (§10 do design): `POST /webhook/set/{instance}`. Não é tarefa de código, mas o plano deve documentar o passo. |
| OS-registered state | Nenhum. | None — não há tarefa agendada/serviço novo. |
| Secrets/env vars | **Novas** env vars na Vercel: `ANTHROPIC_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `WHATSAPP_WEBHOOK_SECRET`, `WHATSAPP_ALLOWED_NUMBER` (ou a allowlist via `WhatsappContact`). Nenhuma existente é renomeada. | Configurar na Vercel (pré-requisito externo) + ler via `process.env` no servidor. Não commitar. |
| Build artifacts | Nenhum. Prisma Client é regenerado no `postinstall`/`build` (`prisma generate`). | `npx prisma generate` após adicionar as tabelas (já acontece no build). |

**Nada encontrado para renomear** — verificado por leitura do schema e do STATE (fase 4 completa, sem referência a WhatsApp).

## Common Pitfalls

### Pitfall 1: Payload da Evolution — `conversation` vs `extendedTextMessage` e `@lid`
**What goes wrong:** O texto pode vir em `data.message.conversation` (mensagem simples) **ou** `data.message.extendedTextMessage.text` (reply/quote/com preview). Se você só ler um, perde metade das mensagens. Além disso, versões recentes podem entregar `data.key.remoteJid` no formato `<id>@lid` (addressingMode "lid") com o número real em `data.key.remoteJidAlt` (`<number>@s.whatsapp.net`).
**Why it happens:** Baileys/WhatsApp variam o envelope por tipo de mensagem; o modo "lid" é novo e está rolando out (ver issue #2794). `[VERIFIED: GitHub evolution-api issue #2794 — payload real citado]`
**How to avoid:** Função `parseInbound` que extrai o texto de ambos os caminhos e deriva o telefone preferindo `remoteJidAlt` quando `remoteJid` termina em `@lid`:
```typescript
const text = msg.conversation ?? msg.extendedTextMessage?.text ?? null
const jid = key.remoteJidAlt ?? key.remoteJid        // prefere o número real quando há @lid
const phone = jid.replace(/@(s\.whatsapp\.net|lid|g\.us)$/, '')
const isGroup = (key.remoteJid ?? '').endsWith('@g.us')
```
**Warning signs:** Mensagens com preview de link ou respostas "não chegam"; número aparece como id estranho `@lid`.

### Pitfall 2: Reentrega da Evolution → lançamento duplicado
**What goes wrong:** Se o handler demora ou responde != 2xx, a Evolution reenvia o mesmo `messages.upsert` → dois lançamentos.
**How to avoid:** Dedupe por `data.key.id` com `@@unique` em `WhatsappInbound`; faça o insert **antes** de lançar; em violação de unique, responda 200 sem relançar. Sempre responda 200 quando o processamento terminou.
**Warning signs:** Dois lançamentos idênticos; dois "✓" no WhatsApp.

### Pitfall 3: `fromMe` e grupos
**What goes wrong:** O bot recebe no webhook também as mensagens que **ele mesmo** enviou (`fromMe:true`) → loop de eco. Mensagens de grupo (`@g.us`) não devem transacionar.
**How to avoid:** `if (key.fromMe) return 200`; `if (isGroup) return 200`. Ambos **antes** de qualquer chamada ao LLM (economiza custo).

### Pitfall 4: Middleware do Supabase intercepta `/api/whatsapp`
**What goes wrong:** `src/middleware.ts` tem matcher que pega **tudo** exceto estáticos; ele chama `supabase.auth.getUser()` e **redireciona para `/login`** quem não tem cookie. O webhook não tem cookie → seria redirecionado, nunca chegando ao handler.
**Why it happens:** O matcher atual: `'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|...)$).*)'` casa `/api/whatsapp/webhook`. `[VERIFIED: src/middleware.ts linha 52-55]`
**How to avoid:** Excluir rotas de API públicas do matcher, ex.: adicionar `api/whatsapp` à negação do regex, ou cedo no middleware `if (request.nextUrl.pathname.startsWith('/api/whatsapp')) return NextResponse.next()`. **Tarefa obrigatória no plano** — sem isso o webhook não funciona.
**Warning signs:** Webhook recebe 307/redirect para `/login` em vez de 200.

### Pitfall 5: Body do `sendText` é version-sensitive
**What goes wrong:** Docs divergem: v2 atual usa `{ "number", "text" }`; specs antigas/alguns mirrors mostram `{ "number", "textMessage": { "text" } }`. Mandar o shape errado → 400.
**Why it happens:** Mudança entre v1 e v2 da Evolution. `[CITED: docs.evolutionfoundation (v2 → {number,text}) e mirror atendai (v1 → {number,textMessage:{text}})]`
**How to avoid:** Confirmar contra a **instância real** do Thaylan (um curl de teste) antes de fixar. Centralizar em `evolution.ts` para trocar num lugar só.

### Pitfall 6: `parseISO` e datas sem timezone
**What goes wrong:** Gravar data com `new Date("2026-11-26")` desloca por fuso.
**How to avoid:** O `createTransactionService` já faz `parseISO(date)` esperando `"YYYY-MM-DD"`. A IA deve devolver exatamente `YYYY-MM-DD` (o tool pede isso). Não construir `Date` à mão. `[VERIFIED: service.ts linha 28]`

### Pitfall 7: Prisma migrate contra o pooler (porta 6543)
**What goes wrong:** `prisma migrate` contra a URL do pooler (6543) **trava** (advisory lock no PgBouncer).
**How to avoid:** Migração sempre via `DIRECT_URL` (5432) — já é o padrão do projeto (CLAUDE.md). Backup antes (dado novo, mas regra da casa). `[CITED: CLAUDE.md]`

## Code Examples

### Reuso do service de lançamento com userId explícito (o ponto central)
```typescript
// Source: src/app/(authed)/lancamentos/_lib/service.ts (lido do repo)
// createTransactionService é função PURA — SEM 'use server', recebe userId.
// NENHUM refactor necessário: o webhook chama exatamente isto.
import { createTransactionService } from '@/app/(authed)/lancamentos/_lib/service'
import { transactionSchema } from '@/app/(authed)/lancamentos/_lib/schema'

// shape esperado (schema.ts):
//   { date: string 'YYYY-MM-DD', description: string, amountCents: int>0,
//     type: 'ENTRADA'|'SAIDA', empresaId: string|null, categoryId: string, notes?: string }
const data = {
  date,
  description: categoriaNome,       // ex.: "Combustível" (ou o texto curto)
  amountCents,
  type,
  empresaId,                        // null = Casa (D-03)
  categoryId,                       // categoria EXISTENTE resolvida (D-04)
}
const parsed = transactionSchema.safeParse(data) // valida antes
if (!parsed.success) { /* perguntar / erro */ }
await createTransactionService({ ...parsed.data, userId }) // userId da allowlist (D-02)
```
> Assinatura exata: `createTransactionService(data: TransactionFormData & { userId: string })`. Faz `prisma.transaction.create` com `parseISO(date)`. **Reusar `transactionSchema` do repo** para validar o payload final (consistência com o form). `[VERIFIED: service.ts + schema.ts]`

### Carregar contexto do usuário para a IA e resolver destino/categoria
```typescript
// Source: src/app/(authed)/empresas/_lib/loader.ts + lancamentos/_lib/loader.ts (lidos)
import { getEmpresas } from '@/app/(authed)/empresas/_lib/loader'   // prisma.empresa.findMany({where:{userId}})
import { getCategories } from '@/app/(authed)/lancamentos/_lib/loader' // prisma.category.findMany({where:{userId}})

const empresas = await getEmpresas(userId)        // [{id, nome, ...}]
const categorias = await getCategories(userId)    // [{id, name, empresaId, kind}]

// contexto p/ IA
const ctx = {
  empresas: empresas.map(e => e.nome),
  categorias: categorias.map(c => c.name),
  hoje: new Date().toISOString().slice(0,10),
}
```
> Nota de reuso: há **dois** `getCategories` (service.ts e loader.ts) — ambos `prisma.category.findMany({where:{userId}})`. Use o de `loader.ts` (já inclui a semântica de leitura) ou o do service; são equivalentes. `[VERIFIED: ambos lidos]`

### Match tolerante (normalização de acentos/caixa)
```typescript
// Função pura, testável. Resolve nome falado → empresaId (ou null=Casa) / categoryId.
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function resolveDestino(
  falado: string | undefined,
  empresas: { id: string; nome: string }[]
): { empresaId: string | null } | { ambiguo: true } | { faltou: true } {
  if (!falado) return { faltou: true }                 // D-03: não adivinha
  const n = norm(falado)
  if (n === 'casa') return { empresaId: null }          // Casa = destino de 1ª classe
  const exatas = empresas.filter(e => norm(e.nome) === n)
  if (exatas.length === 1) return { empresaId: exatas[0].id }
  const contendo = empresas.filter(e => norm(e.nome).includes(n) || n.includes(norm(e.nome)))
  if (contendo.length === 1) return { empresaId: contendo[0].id }
  return { ambiguo: true }                               // pergunta oferecendo opções
}
```
> **Onde traçar a linha "pergunta vs adivinha":** só resolve automaticamente quando há **exatamente uma** correspondência (exata ou substring única). Zero ou múltiplas → **pergunta**. Mesma lógica para categoria, filtrando por `empresaId` do destino já resolvido (categorias são por-empresa). `kind` da categoria da empresa é inferido do `type`: ENTRADA→RECEITA, SAÍDA→CUSTO; Casa → `kind` null (D-04). Como esta fatia **só usa categorias existentes**, o `kind` já está gravado na categoria — a inferência só importaria se fôssemos criar (fora do escopo).

### Resposta de confirmação (PT-BR, R$/data no padrão)
```typescript
// Source: src/lib/format.ts (formatBRL, formatDate)
import { formatBRL } from '@/lib/format'
const destinoLabel = empresaId ? empresaNome : 'Casa'
const confirmacao = `✓ ${formatBRL(amountCents)} · ${categoriaNome} · ${destinoLabel}`
// ex.: "✓ R$ 50,00 · Combustível · Casa"
```

### Dedupe + envio
```typescript
// dedupe: insere antes de lançar; unique viola → já processado
try {
  await prisma.whatsappInbound.create({ data: { messageId, phone, processed: false } })
} catch (e) {
  // Prisma P2002 (unique) → mensagem repetida
  return Response.json({ duplicate: true }, { status: 200 })
}

// envio
await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: process.env.EVOLUTION_API_KEY! },
  body: JSON.stringify({ number: phone, text: confirmacao }),
})
```

## Evolution API — reference (field paths & endpoints)

### Envelope do webhook (`messages.upsert`)
`[VERIFIED: GitHub evolution-api issue #2794 (payload real) + CITED: docs.evolutionfoundation]`
```jsonc
{
  "event": "messages.upsert",        // nome do evento
  "instance": "nome-da-instancia",
  "data": {
    "key": {
      "remoteJid": "<id>@s.whatsapp.net",   // ou "<id>@lid" (modo novo), ou "...@g.us" (grupo)
      "remoteJidAlt": "<number>@s.whatsapp.net", // presente quando remoteJid é @lid → número real
      "fromMe": false,                       // true = mensagem enviada pelo próprio bot → ignorar
      "id": "BAE5..."                        // id da mensagem → chave de idempotência
    },
    "pushName": "Thaylan",                    // nome exibido do remetente
    "messageType": "conversation",            // ou "extendedTextMessage"
    "message": {
      "conversation": "gastei 50 de gasolina na casa"          // texto simples
      // OU:
      // "extendedTextMessage": { "text": "..." }              // reply/quote/preview
    },
    "messageTimestamp": 1764170000
  },
  "sender": "...", "server_url": "...", "apikey": "...", "date_time": "..."
}
```
- **Texto:** `data.message.conversation` **ou** `data.message.extendedTextMessage.text` (ler ambos — Pitfall 1).
- **Remetente:** `data.key.remoteJid` (preferir `remoteJidAlt` se `@lid`).
- **Id p/ idempotência:** `data.key.id`.
- **Filtrar eco:** `data.key.fromMe === true`.
- **Filtrar grupo:** `data.key.remoteJid` termina em `@g.us`.

### Configurar webhook da instância (pré-requisito externo)
`[CITED: docs.evolutionfoundation.com.br/evolution-api/set-webhook]`
```
POST {EVOLUTION_API_URL}/webhook/set/{instanceName}
Header: apikey: <EVOLUTION_API_KEY>
Body: {
  "enabled": true,
  "url": "https://<app>.vercel.app/api/whatsapp/webhook",
  "events": ["MESSAGES_UPSERT"],   // só o que precisamos nesta fatia
  "base64": false,
  "webhook_by_events": false       // um único endpoint
}
```
> O segredo compartilhado: a Evolution não assina HMAC por padrão. Duas opções: (a) embutir o segredo na **query string** da URL do webhook (`?secret=...`) e comparar com `timingSafeEqual`; (b) usar o campo `headers` do set-webhook para mandar um header custom (`Authorization`/`x-webhook-secret`). Confirmar qual a instância do Thaylan suporta; (a) é o mais simples e sempre funciona. `[ASSUMED — confirmar com a instância real]`

### Enviar texto de volta
`[CITED: docs.evolutionfoundation (v2) — body {number,text}]`
```
POST {EVOLUTION_API_URL}/message/sendText/{instanceName}
Header: apikey: <EVOLUTION_API_KEY>
Body (v2): { "number": "5511999999999", "text": "✓ R$ 50,00 · Combustível · Casa" }
```
> **Version-sensitive (Pitfall 5):** mirrors antigos mostram `{ "number", "textMessage": { "text" } }`. Confirmar contra a instância real antes de fixar. `number` sem o `+`, com DDI (ex.: `55...`).

## Idempotency + multi-turn state (Postgres via Prisma)

Esquema proposto (aditivo, cmrpe a nota de nomes do schema.prisma: Casa = `empresaId` null). Chaves/tipos finos a critério do builder (D-07):

```prisma
// Allowlist + identidade do canal (D-02/D-06). Uma linha por número autorizado.
model WhatsappContact {
  id          String   @id @default(cuid())
  phone       String   @unique                 // só dígitos com DDI, ex.: "5511999999999"
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  consentAt   DateTime                          // consentimento LGPD (data) — §5 do design
  active      Boolean  @default(true)           // allowlist on/off
  createdAt   DateTime @default(now())
}

// Log + idempotência (D-06). unique(messageId) é a garantia anti-duplicata.
model WhatsappInbound {
  id          String   @id @default(cuid())
  messageId   String   @unique                  // data.key.id da Evolution
  phone       String
  processed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  @@index([phone])
}

// Estado multi-turno (D-07). Uma ação pendente ativa por número.
model WhatsappPendingAction {
  id          String   @id @default(cuid())
  phone       String   @unique                  // 1 pendência por número → upsert simples
  kind        String                            // 'ask_destino' | 'ask_categoria'
  partial     Json                              // extração parcial {tipo,valorCents,data,categoria,...}
  expiresAt   DateTime                           // TTL curto (ex.: now()+15min)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```
Adicionar relação inversa `whatsappContacts WhatsappContact[]` em `User`.

**Dedupe:** insere `WhatsappInbound` cedo; `P2002` (unique violation) → mensagem já vista → 200. (Alternativa: `prisma.whatsappInbound.create` dentro de try/catch; não usar `upsert` porque queremos detectar a repetição.)

**Multi-turno:** antes de chamar a IA, `findFirst({where:{phone, expiresAt:{gt:now}}})`. Se existe, a nova mensagem é a resposta (ex.: "Achadinhos" / "Casa" / nome de categoria) → faz merge em `partial`, re-resolve, e se completo → lança e **deleta** a pendência. TTL (`expiresAt`) evita que uma pergunta antiga "sequestre" uma mensagem nova e solta; pendência expirada é ignorada/limpa. Uma pendência por número (`phone @unique`) mantém simples (upsert); se quiser histórico, troque por índice não-único + filtro por mais recente.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prefill de assistant para forçar JSON | `tools` + `tool_choice:{type:'tool'}` (e/ou `output_config.format`) | Modelos 4.6+ (prefill dá 400) | Haiku 4.5: use tool use, não prefill |
| `budget_tokens` para thinking | n/a no Haiku (sem effort/thinking) | — | Não passar effort/thinking no Haiku |
| Evolution v1 body `{textMessage:{text}}` | v2 body `{text}` | v1→v2 | Confirmar versão da instância (Pitfall 5) |

**Deprecated/outdated:**
- Prefill de assistant para JSON: substituído por tool use. `[CITED: claude-api skill]`

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Custo ~US$0,0007/mensagem no Haiku | Code Examples / Pattern 2 | Baixo — só estimativa; medir `response.usage` real |
| A2 | Segredo via query string `?secret=` funciona na instância do Thaylan | Evolution set-webhook | Médio — se a instância não repassar query, usar `headers` custom; confirmar na instância real |
| A3 | Body do `sendText` v2 é `{number,text}` | Evolution send / Pitfall 5 | Médio — mirror antigo usa `{textMessage:{text}}`; um curl de teste resolve antes de fixar |
| A4 | `messages.upsert` é o nome do evento exato recebido (vs `MESSAGES_UPSERT` no set-webhook) | Evolution webhook | Baixo — o payload usa `messages.upsert` (minúsculo/ponto) no campo `event`; o set-webhook lista em MAIÚSCULAS. Ler da instância real confirma |
| A5 | `@anthropic-ai/sdk` é legítimo apesar do verdict SUS | Package Legitimacy | Baixo — 73M downloads + repo oficial; SUS é falso positivo (too-new do mirror) |
| A6 | Modo `@lid`/`remoteJidAlt` aparece na instância do Thaylan | Pitfall 1 | Baixo — tratar ambos os caminhos é defensivo e barato |

## Open Questions

1. **Segredo do webhook: query string ou header?**
   - Sabemos: Evolution não assina HMAC por padrão; `set-webhook` aceita `headers` custom e aceita query na URL.
   - Incerto: qual a instância do Thaylan repassa de forma confiável.
   - Recomendação: implementar `verifyWebhookSecret` que aceita **ambos** (header `x-webhook-secret` OU query `?secret=`) e comparar com `timingSafeEqual`; decidir no setup.

2. **Versão exata da Evolution (v1 vs v2) → body do sendText.**
   - Recomendação: um `checkpoint:human-verify` com um curl de teste contra a instância real antes de fixar `evolution.ts`.

3. **Timeout real do LLM vs tempo da função Vercel.**
   - Sabemos: Haiku é rápido; volume é baixo; default de função serverless na Vercel costuma ser suficiente.
   - Recomendação: processar inline; medir latência p95; se exceder, migrar passo 5–8 para fila (fora do escopo, nota pra Fatia futura).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@anthropic-ai/sdk` (npm) | Extração IA | ✗ (instalar) | 1.14.0 | — (bloqueante; `npm install`) |
| `zod` | Validação | ✓ | ^3.25.76 | — |
| `@prisma/client` + migração | Tabelas novas | ✓ | ^6.19.3 | — |
| `ANTHROPIC_API_KEY` | Claude | ✗ (configurar Vercel) | — | sem fallback — bloqueia a extração |
| `EVOLUTION_API_URL`/`_KEY`/`_INSTANCE` | Receber/enviar | ✗ (configurar Vercel) | — | sem fallback — bloqueia envio |
| `WHATSAPP_WEBHOOK_SECRET` | Segurança | ✗ (configurar) | — | sem fallback — bloqueia validação |
| Instância Evolution na VPS (número do bot, webhook apontado) | Transporte | ✗ (pré-requisito externo Thaylan) | — | sem fallback — sem isso não chega evento |

**Missing dependencies with no fallback (bloqueantes):** `@anthropic-ai/sdk` (código — `npm install`), e todas as env vars + a instância Evolution configurada (pré-requisitos externos do Thaylan, §10 do design). O plano deve ter um **checkpoint** confirmando env vars + instância antes do teste end-to-end.

**Missing dependencies with fallback:** nenhuma.

## Validation Architecture

> `workflow.nyquist_validation: true` → seção incluída.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `^3.2.7` |
| Config file | `vitest.config.ts` (environment `node`, alias `@`→`src`, include `src/**/*.test.ts`) |
| Quick run command | `npx vitest run src/lib/whatsapp` |
| Full suite command | `npm test` (= `vitest run`) |

### Padrão de teste (do repo)
Os testes existentes **mockam `@/lib/prisma`** com `vi.hoisted` + `vi.mock` e inspecionam as chamadas (ver `lancamentos/_lib/service.test.ts`). Reusar esse padrão. Para a IA, **mockar o cliente Anthropic** (ou injetar a função `extractLancamento` como dependência) para testar o mapeamento sem rede.

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | File Exists? |
|-----|----------|-----------|-------------------|-------------|
| parse | `parseInbound` extrai texto de `conversation` E `extendedTextMessage`; detecta `fromMe`, grupo, `@lid` | unit (puro, sem mock) | `npx vitest run src/lib/whatsapp/parse.test.ts` | ❌ Wave 0 |
| C-2 | `resolveDestino`/`resolveCategoria`: match único → resolve; "Casa" → null; zero/múltiplos → pergunta | unit (puro) | `npx vitest run src/lib/whatsapp/resolve.test.ts` | ❌ Wave 0 |
| IA | Zod `safeParse` aceita saída válida, rejeita inválida; mapeia tool_use.input → TransactionFormData | unit (mock Anthropic) | `npx vitest run src/lib/whatsapp/ai.test.ts` | ❌ Wave 0 |
| C-1 | Fluxo "lançar" chama `createTransactionService` com empresaId/categoryId/type corretos (Casa e empresa) | unit (mock prisma) | `npx vitest run src/lib/whatsapp/flow.test.ts` | ❌ Wave 0 |
| C-3 | Dedupe: segundo `messageId` igual não relança (P2002 → 200); allowlist: número fora → ignora | unit (mock prisma) | `npx vitest run src/lib/whatsapp/service.test.ts` | ❌ Wave 0 |
| multi-turno | pendência: falta destino → grava partial; próxima msg completa e lança; expirada → ignora | unit (mock prisma) | `npx vitest run src/lib/whatsapp/pending.test.ts` | ❌ Wave 0 |
| webhook | handler: segredo inválido → 200 ignore; `fromMe`/grupo → 200 ignore; feliz → 200 + sendText chamado | integration (mock ai+prisma+fetch) | `npx vitest run src/app/api/whatsapp/webhook/route.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/whatsapp` (funções puras — <2s)
- **Per wave merge:** `npm test` (suíte completa)
- **Phase gate:** `npm test` verde + `npm run build` (tsc) limpo antes de `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/whatsapp/parse.test.ts` — payloads mockados (conversation, extendedText, fromMe, grupo, @lid)
- [ ] `src/lib/whatsapp/resolve.test.ts` — match tolerante / ask-vs-adivinha
- [ ] `src/lib/whatsapp/ai.test.ts` — Zod + mapeamento (cliente Anthropic mockado)
- [ ] `src/lib/whatsapp/service.test.ts` — dedupe (P2002) + allowlist (mock prisma)
- [ ] `src/lib/whatsapp/pending.test.ts` — ação pendente + TTL
- [ ] `src/app/api/whatsapp/webhook/route.test.ts` — orquestração (mock ai/prisma/fetch)
- [ ] Fixtures: 2–3 payloads reais de `messages.upsert` (um simples, um extendedText, um grupo)

## Security Domain

> `security_enforcement: true`, ASVS nível 1, `security_block_on: high`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | **Autenticação do canal = segredo do webhook + allowlist** (D-02/D-06). O webhook não tem sessão; a identidade vem da linha `WhatsappContact` ativa pelo telefone. Segredo comparado com `crypto.timingSafeEqual`. |
| V3 Session Management | no | Não há sessão de usuário no webhook (chamador server-side confiável). |
| V4 Access Control | yes | `userId` resolvido pela allowlist; o service **já** filtra por `userId` (ownership). Número fora da allowlist → ignora (não vaza dados — anti-objetivo nº 4). Categoria/empresa resolvidas sempre dentro do `userId` (IDOR coberto pelos loaders `where:{userId}`). |
| V5 Input Validation | yes | **Zod** valida a saída da IA; `transactionSchema` valida o payload final antes de gravar. Payload do webhook tratado como não-confiável (parse defensivo). |
| V6 Cryptography | yes | Comparação do segredo com `timingSafeEqual` (constant-time); nunca `===`. Segredos só em env vars (não no git). |

### Known Threat Patterns for {Next.js webhook + LLM + Prisma}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Webhook forjado por terceiro | Spoofing | Segredo compartilhado (`timingSafeEqual`) + allowlist de número; responder 200 ignore (não revela rejeição) |
| Replay / reentrega → duplicata | Tampering/DoS | Dedupe por `@@unique(messageId)` |
| Loop de eco (`fromMe`) | DoS | Filtrar `fromMe:true` antes do LLM |
| Vazar finanças a número não autorizado | Info Disclosure | Allowlist; número desconhecido nunca recebe dados nem lança (anti-objetivo nº 4) |
| IDOR cross-user (empresa/categoria de outro user) | Elevation | Loaders e service filtram por `userId`; `createTransactionService` grava com `userId` da allowlist |
| Prompt injection no texto da mensagem | Tampering | A IA só preenche um tool com enums/tipos fixos; o resultado é re-validado por Zod e a **regra Casa×Empresa é código, não o LLM** — o LLM nunca decide `categoryId`/`empresaId` final, só sugere nomes que o código resolve |
| Segredo/API key em log ou git | Info Disclosure | Env vars na Vercel; não logar body cru com dados financeiros; `.env.local` no gitignore |
| LGPD — dado financeiro via WhatsApp | Compliance | `WhatsappContact.consentAt` registra consentimento com data (§5 design) |

## Sources

### Primary (HIGH confidence)
- **Repo (lido):** `src/app/(authed)/lancamentos/_lib/{service,actions,schema,loader}.ts`, `src/app/(authed)/empresas/_lib/loader.ts`, `src/lib/{format,prisma}.ts`, `src/middleware.ts`, `src/app/api/health/route.ts`, `prisma/schema.prisma`, `vitest.config.ts`, `package.json`, `.planning/config.json` — caminho de reuso, middleware matcher, padrão de teste, versões.
- **claude-api skill (autoritativa):** modelo `claude-haiku-4-5` + id datado, preço $1/$5 MTok, tool use + `tool_choice:{type:'tool'}`, `strict:true`, Haiku sem effort/thinking, prefill→tool use.
- **npm:** `@anthropic-ai/sdk` 1.14.0, sem postinstall, repo oficial.

### Secondary (MEDIUM confidence)
- docs.evolutionfoundation.com.br — `set-webhook` (`POST /webhook/set/{instance}`, body enabled/url/events/headers/base64), `send-text-message` (`POST /message/sendText/{instance}`, header `apikey`).
- GitHub evolution-api issue #2794 — payload real de `messages.upsert` (confirma `key.fromMe`, `key.remoteJid`/`remoteJidAlt` `@lid`, `messageType`, `message.conversation`).

### Tertiary (LOW confidence)
- Mirrors mintlify/atendai da doc Evolution — divergência de body do sendText (v1 `{textMessage:{text}}` vs v2 `{text}`) → marcado como Assumption A3.

## Metadata

**Confidence breakdown:**
- Reuse do service / integração no repo: HIGH — lido direto do código, função pura já aceita `userId`.
- Anthropic SDK / modelo / tool use: HIGH — skill oficial `claude-api`.
- Payload da Evolution (field paths): MEDIUM — docs oficiais + payload real de issue, mas version-sensitive e com modo `@lid` em rollout; confirmar na instância real.
- Segredo do webhook (query vs header) e body do sendText: MEDIUM/LOW — confirmar com a instância do Thaylan (A2, A3).

**Research date:** 2026-11-26
**Valid until:** ~2026-12-10 (Evolution API é fast-moving; Anthropic SDK e repo são estáveis)

Sources:
- [Evolution API set-webhook](https://docs.evolutionfoundation.com.br/evolution-api/set-webhook.md)
- [Evolution API send-text-message](https://docs.evolutionfoundation.com.br/evolution-api/send-text-message.md)
- [evolution-api issue #2794 (payload real messages.upsert)](https://github.com/evolution-foundation/evolution-api/issues/2794)
- [Evolution API webhooks config](https://docs.evolutionfoundation.com.br/en/evolution-api/configuration/webhooks)
