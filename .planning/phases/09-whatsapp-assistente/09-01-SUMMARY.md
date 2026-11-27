---
phase: 09-whatsapp-assistente
plan: 01
wave: 1
status: complete
completed: 2026-11-27
---

# 09-01 SUMMARY — Fundação da Fatia 1 (WhatsApp)

## O que foi construído

1. **Migração aditiva (3 tabelas)** — `WhatsappContact` (allowlist + consentimento LGPD),
   `WhatsappInbound` (idempotência por `messageId @unique`), `WhatsappPendingAction` (estado
   multi-turno com TTL). Relação inversa `whatsappContacts` em `User`. Aplicada no banco de
   produção via `prisma migrate deploy` (DIRECT_URL/5432, **sem shadow-db**), após backup fresco
   e autorização direta do usuário. `migrate status`: sem drift.
2. **@anthropic-ai/sdk@1.14.0** instalado (extração via Claude Haiku — usado no 09-02).
3. **Middleware** — early-return para `/api/whatsapp` antes de `supabase.auth.getUser()`, senão o
   webhook (sem cookie) seria redirecionado 307 → /login e o handler nunca rodaria.
4. **Funções puras + testes (RED→GREEN)** — `parseInbound` (payload Evolution → campos
   normalizados: conversation/extended, fromMe, grupo @g.us, número real via remoteJidAlt em @lid),
   `resolveDestino`/`resolveCategoria` (regra Casa×Empresa, match tolerante sem acento, "na dúvida
   pergunta" — nunca adivinha, D-03/D-04), `aiResultSchema` (Zod).

## Verificação

- `npx prisma migrate status` → migração `add_whatsapp_tables` aplicada, "Database schema is up to date!".
- Prisma Client expõe `whatsappContact`/`whatsappInbound`/`whatsappPendingAction`.
- `grep startsWith('/api/whatsapp') src/middleware.ts` → 1 ocorrência (antes do auth).
- `require('@anthropic-ai/sdk')` resolve; versão 1.14.0.
- `npx vitest run` → **165/165** (22 novos: parse 7, resolve 10, schema 5).
- `npm run build` → Compiled successfully (warnings pré-existentes, não introduzidos aqui).

## Commits

- `61ddf97` feat(09-01): migração aditiva — 3 tabelas
- `ecf662d` feat(09-01): instala @anthropic-ai/sdk + libera /api/whatsapp no middleware
- `test(09-01)` testes RED + `feat(09-01)` implementação GREEN

## Desvios

Nenhum desvio de escopo. Método de migração: usei `migrate diff` (só leitura) + `migrate deploy`
em vez de `migrate dev` — evita o shadow-db (risco documentado no CLAUDE.md / incidente anterior).
Mesmo resultado aditivo, mais seguro.

## Handoff para 09-02

- `createTransactionService(data & { userId })` em `lancamentos/_lib/service.ts` é o caminho a reusar.
- Destino: `resolveDestino` já devolve `{empresaId:null}` para Casa; mapear o payload com
  `description = categoriaNome` (AiResult não tem `description`; `transactionSchema` exige).
- Empresa expõe `nome`; Category expõe `name` (W2) — ao montar o contexto da IA: `empresas.map(e=>e.nome)` / `categorias.map(c=>c.name)`.
- Env a configurar na Vercel (09-02/09-03): `ANTHROPIC_API_KEY`, `EVOLUTION_API_URL`,
  `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `WHATSAPP_WEBHOOK_SECRET`.
