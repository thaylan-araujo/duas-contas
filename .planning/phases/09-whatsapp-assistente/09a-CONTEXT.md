# Phase 9 · Fatia 1 — WhatsApp: Texto → lançar (núcleo) — Context

**Gathered:** 2026-11-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Primeira fatia do Assistente de WhatsApp: o usuário manda uma **frase de texto** em PT-BR e o
sistema cria um **lançamento simples** (gasto/receita numa conta — Casa ou empresa), respeitando a
regra de ouro Casa × Empresa, e confirma por mensagem.

Entrega:
1. **Webhook** `POST /api/whatsapp/webhook` (Route Handler, Vercel/serverless) que recebe eventos da
   Evolution API.
2. **Segurança:** validação de segredo compartilhado do webhook + **allowlist de número** (só o
   número autorizado transaciona). **Idempotência:** mensagem repetida (mesmo id) não lança duas vezes.
3. **IA (Claude Haiku)** — camada isolada que recebe o texto + contexto (empresas e categorias do
   usuário) e devolve objeto validado por **Zod**: intenção (`lancar`|`relatorio`|`esclarecer`|`ajuda`),
   tipo (ENTRADA/SAIDA), valorCents, data, categoria, destino, confiança. (Relatórios reconhecidos
   como intenção, mas respondidos só na Fatia 3 — aqui o bot responde que ainda não faz relatório.)
4. **Regra de destino:** destino = **Casa (empresaId null)** ou uma **empresa** (match por nome).
   Destino ausente/ambíguo → **pergunta** (multi-turno). "Casa" dito → lança na Casa.
5. **Categoria:** mapeia pra categoria **existente** do destino; se não casar, pergunta e oferece as
   categorias daquele destino. **Não cria categoria nova por chat.** `kind` da empresa inferido do
   tipo (ENTRADA→RECEITA, SAÍDA→CUSTO); Casa = null.
6. **Multi-turno:** quando falta dado (destino/categoria), guarda uma **ação pendente** por número no
   Postgres (payload parcial + expiração); a próxima mensagem completa a ação.
7. **Criar lançamento** reusando o service existente de lançamentos (passando o `userId` resolvido) +
   **confirmação** ("✓ R$ 50 · Combustível · Casa").

**Fora desta fatia:** pró-labore (Fatia 2), relatórios (Fatia 3), foto/OCR (Fatia 4), áudio (Fatia 5).
Tela/UI nova (o canal é o WhatsApp). Multiusuário.
</domain>

<decisions>
## Implementation Decisions (do design aprovado)

- **D-01 (abordagem):** webhook no próprio app Next.js (Vercel), **não** n8n nem micro-serviço — a
  regra inviolável Casa × Empresa fica em código TS tipado/testável reusando os services existentes.
- **D-02 (identidade):** app ainda é single-user. Número autorizado → único usuário existente via
  linha `WhatsappContact` criada no setup (sem tela de cadastro). Webhook é **chamador server-side
  confiável**: resolve `userId` pela allowlist e chama o service direto (sem sessão/cookie).
- **D-03 (destino):** Casa é destino de primeira classe (`empresaId = null`), distinto de "não
  informado". Na dúvida, pergunta — nunca adivinha (anti-objetivo nº 1).
- **D-04 (categoria):** só categorias existentes; sem criação por chat nesta fase; `kind` inferido.
- **D-05 (IA):** Claude Haiku via Anthropic SDK, saída estruturada (tool use) validada por Zod.
  Camada isolada (trocável de provedor depois). Base = spike de 26/11 (texto validado).
- **D-06 (segurança/idempotência):** segredo do webhook + allowlist; dedupe por id de mensagem.
- **D-07 (estado):** ação pendente multi-turno persistida no Postgres (serverless não guarda memória).

### Claude's Discretion (seção 9 do design)
- Formato exato do payload da Evolution (ler da instância real) e extração de texto/remetente.
- Match tolerante de categoria/empresa e quando perguntar.
- Esquema fino das tabelas novas (`WhatsappContact`, `WhatsappInbound`, `WhatsappPendingAction`) e TTL.
- Processar inline × responder ack e processar (conforme tempo real da função).
- Prompt e formato de saída estruturada do Claude.
- Textos exatos das respostas do bot (curto, PT-BR, R$/datas no padrão).
</decisions>

<canonical_refs>
## Canonical References
- `docs/superpowers/specs/2026-11-26-whatsapp-assistant-design.md` — **design autoritativo** (ler primeiro).
- `docs/research/2026-11-26-benchmark-controle-financeiro.md` — §D e §decisões travadas + spike PT-BR.
- `prisma/schema.prisma` — Transaction/Category/Empresa (Casa = empresaId null; categoria por empresa + kind).
</canonical_refs>

<code_context>
## Existing Code Insights
- `src/app/(authed)/lancamentos/_lib/service.ts` — criação de lançamento (reusar, passando userId).
- `src/app/(authed)/lancamentos/_lib/actions.ts` — `'use server'` + `getUserId()` da sessão: o
  webhook NÃO usa isso; chama o service com o userId resolvido pela allowlist.
- `src/lib/format.ts` — formatBRL/formatDate (respostas do bot em PT-BR).
- Categorias/empresas do usuário (loaders existentes) para dar contexto à IA e resolver destino/categoria.
- Migração aditiva (tabelas novas) — backup checkpoint (CLAUDE.md), DIRECT_URL, nunca shadow-db no banco real.
- Precisa instalar o SDK da Anthropic; `zod` já está no projeto.
</code_context>

<deferred>
## Deferred Ideas
Pró-labore por chat (Fatia 2), relatórios (Fatia 3), OCR de cupom (Fatia 4), áudio (Fatia 5),
Open Finance, multiusuário/família no WhatsApp, agenda/tarefas/notas como novos ramos do roteador.
</deferred>

---

*Phase: 9 · Fatia 1 — WhatsApp: Texto → lançar (núcleo)*
*Context gathered: 2026-11-26*
