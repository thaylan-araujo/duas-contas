---
phase: 09-whatsapp-assistente
plan: 02
subsystem: whatsapp
wave: 2
status: complete
completed: 2026-11-27
tags: [webhook, llm, anthropic-haiku, evolution-api, idempotencia, allowlist, casa-empresa]
requires:
  - "09-01: parseInbound, resolveDestino/resolveCategoria, aiResultSchema, tabelas Whatsapp*"
  - "createTransactionService + transactionSchema (lancamentos/_lib)"
  - "getEmpresas (empresas/_lib/loader), getCategories (lancamentos/_lib/loader)"
provides:
  - "POST /api/whatsapp/webhook — pipeline texto→lançar→confirmar (caminho feliz, destino explícito)"
  - "extractLancamento (ai.ts), sendText (evolution.ts), resolveContact/dedupeInbound (service.ts)"
  - "verifyWebhookSecret (security.ts), textos PT-BR (messages.ts)"
affects:
  - "09-03: multi-turno (pendência), endurecimento, checkpoint de setup Evolution/env"
tech-stack:
  added: ["@anthropic-ai/sdk@1.14.0 (instalado no 09-01, usado aqui)"]
  patterns: ["Route Handler nodejs + force-dynamic", "cliente/fetch injetável para teste offline", "sempre 200 no webhook", "regra Casa×Empresa em código, LLM só sugere"]
key-files:
  created:
    - src/lib/whatsapp/ai.ts
    - src/lib/whatsapp/evolution.ts
    - src/lib/whatsapp/security.ts
    - src/lib/whatsapp/service.ts
    - src/lib/whatsapp/messages.ts
    - src/app/api/whatsapp/webhook/route.ts
    - src/lib/whatsapp/ai.test.ts
    - src/lib/whatsapp/service.test.ts
    - src/app/api/whatsapp/webhook/route.test.ts
  modified: []
decisions:
  - "Webhook sempre responde 200 (mesmo em erro interno capturado) para não disparar retry da Evolution; dedupe cobre reentregas"
  - "LLM nunca decide empresaId/categoryId final — só sugere nomes que resolveDestino/resolveCategoria (código) resolvem (T-09-06)"
  - "Incerteza de destino/categoria responde pergunta simples SEM persistir (multi-turno fica no 09-03)"
metrics:
  duration_min: 6
  tasks: 3
  files: 9
  tests_added: 26
  tests_total: 191
---

# Phase 9 Plan 02: Fatia 1 WhatsApp — Texto → lançar (núcleo) Summary

Pipeline ponta-a-ponta mais fina que funciona: uma mensagem PT-BR com destino explícito entra pelo webhook no próprio app Next.js, é autenticada (segredo constant-time + allowlist), deduplicada por messageId, extraída pelo Claude Haiku (tool use forçado), validada por Zod, resolvida Casa×Empresa e vira um lançamento REAL via `createTransactionService` reusado — com confirmação por WhatsApp. Tudo coberto por teste de integração com Anthropic e Evolution mockados (nenhuma rede/DB real).

## O que foi construído

**Task 1 — Seams externos** (`ai.ts`, `evolution.ts`, `security.ts`)
- `extractLancamento(text, ctx, client?)`: Claude Haiku (`claude-haiku-4-5`) com `tool_choice:{type:'tool'}` forçado; retorna o `tool_use.input` cru (o chamador valida com `aiResultSchema`); lança quando não há bloco `tool_use`; cliente Anthropic injetável (sem rede nos testes); sem `effort`/`thinking` (Haiku não suporta).
- `verifyWebhookSecret(req, expected)`: `crypto.timingSafeEqual` (constant-time, nunca `===`), igualando o comprimento dos buffers; aceita header `x-webhook-secret` OU query `?secret=`; false quando ausente/não configurado.
- `sendText(phone, text, deps?)`: wrapper REST v2 `{number,text}` com `apikey`; `fetch`/baseUrl/instance/apiKey injetáveis — ponto único para trocar v1↔v2 (Pitfall 5).

**Task 2 — Banco** (`service.ts`)
- `resolveContact(phone)`: `whatsappContact.findFirst({phone, active:true})` → registro (com `userId`) ou null (allowlist; número fora nunca vaza — T-09-04).
- `dedupeInbound({messageId, phone})`: `create` dentro de try/catch; `P2002` → `{duplicate:true}`; sucesso → `{duplicate:false}`; outro erro propaga (T-09-02). Singleton `@/lib/prisma`, sem `new PrismaClient()`.

**Task 3 — Orquestração** (`route.ts`, `messages.ts`)
- `POST` com `runtime='nodejs'` + `dynamic='force-dynamic'`. Ordem: (1) segredo → (3) fromMe/grupo → (4) allowlist → (5) dedupe → (6) contexto + IA → (7) Zod → (8) roteia intent. No `lancar`: `resolveDestino` + `resolveCategoria`; se ambos resolvem (match único), monta payload (`description = nome da categoria`), valida com `transactionSchema`, chama `createTransactionService({...data, userId})` e envia a confirmação. Casa grava `empresaId:null`; empresa grava o `empresaId` certo. Incerteza → pergunta simples + 200 (sem persistir). SEMPRE 200.
- `messages.ts`: confirmação `✓ ${formatBRL} · ${categoria} · ${destinoLabel}` + perguntas/ajuda/relatório — toda formatação via `@/lib/format`.

## Verificação

- `npx vitest run` → **191/191** (26 novos: ai 9, service 5, route 12). Suíte anterior 165 intacta.
- `npm run build` → "Compiled successfully"; `/api/whatsapp/webhook` registrada como rota dinâmica (ƒ).
- Inspeção: handler responde 200 em todos os ramos; `createTransactionService` é o único caminho de escrita (reuso, sem reimplementação da regra Casa×Empresa).

## Threat model — mitigações aplicadas

- **T-09-01** (spoofing): `verifyWebhookSecret` com `timingSafeEqual` + allowlist; rejeição → 200 `{ignored}` sem revelar motivo.
- **T-09-02** (replay/duplicata): `dedupeInbound` insere antes de lançar; P2002 → 200 sem relançar.
- **T-09-03** (eco/grupo): `fromMe`/`isGroup` → 200 ANTES do LLM.
- **T-09-04** (vazamento): número fora da allowlist → 200 ignore, nada processado.
- **T-09-05** (IDOR): `getEmpresas`/`getCategories` filtram por `userId`; lançamento gravado com o `userId` da allowlist; destino/categoria só dentro do contexto desse user.
- **T-09-06** (prompt injection): IA só preenche o tool; resultado re-validado por `aiResultSchema` + `transactionSchema`; o LLM nunca decide `empresaId`/`categoryId` final.
- **T-09-07** (segredo em log): segredos só em env; erro capturado loga mensagem genérica (sem body/segredo).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug de teste] Espaço não-quebrável em formatBRL**
- **Encontrado em:** Task 3 (teste do caminho feliz Casa).
- **Problema:** `formatBRL(5000)` produz `"R$ 50,00"` (NBSP entre "R$" e o número, via `Intl.NumberFormat`). O `expect(text).toContain('R$ 50,00')` com espaço comum falhava.
- **Correção:** normalizar o NBSP no teste antes do `toContain` (a implementação está correta — é o comportamento esperado do formatador do projeto).
- **Arquivos:** `src/app/api/whatsapp/webhook/route.test.ts`
- **Commit:** f06d38b

Nenhum outro desvio de escopo. Nenhum gate de autenticação ocorreu (seams externos mockados; env lida só em runtime).

## Known Stubs

Nenhum. O `destinoLabel` cai para `'Empresa'` e `categoriaNome` para `''` apenas em caminhos impossíveis (id já resolvido a partir da própria lista) — defensivos, não stubs que impedem o objetivo.

## Handoff para 09-03

- **Multi-turno**: hoje, destino/categoria incertos → pergunta + 200 SEM persistir. O 09-03 grava `WhatsappPendingAction` (TTL), lê a pendência antes da IA e completa na próxima mensagem.
- **Setup externo (checkpoint)**: configurar na Vercel `ANTHROPIC_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `WHATSAPP_WEBHOOK_SECRET`; apontar o webhook da instância Evolution para `/api/whatsapp/webhook` com o segredo (header ou `?secret=`). Confirmar o body do `sendText` (v2 `{number,text}` vs v1) com um curl real — ponto único em `evolution.ts`.
- **Endurecimento**: marcar `WhatsappInbound.processed=true` após sucesso; medir `response.usage`/latência p95 do Haiku; validação de tamanho/limite do texto de entrada.

## Self-Check: PASSED

Todos os 9 arquivos criados existem em disco; todos os 6 commits (be704d3, e8a6510, 00b8dd6, c8d1e88, 1e7ca3a, f06d38b) existem no histórico.
