# Phase 11 — Reorganização da Casa (IA) — Context

**Gathered:** 2026-11-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Reorganiza a navegação da Casa separando **ver** de **editar**, reaproveitando os componentes
existentes. **Sem migração de banco, sem mudar regra de negócio nem o cálculo "posso gastar".**

Entrega:
1. **Visão Geral só-leitura:** hero "posso gastar", resumo das contas fixas (com pílula de status, sem
   botões), variável da semana + tetos (acompanhamento), renda familiar, gráficos. Nenhuma ação de editar.
2. **Lançamentos vira o hub de edição, em abas:** "Lançamentos" (lista + CRUD), "Contas fixas" (CRUD de
   FixedAccount + gerar o mês + marcar pago + valor variável), e os tetos por categoria + gerenciar categorias.
3. **Metas** vira item próprio do menu (metas/reservas), separado das contas fixas.
4. **"Planejamento" sai do menu:** acompanhamento → Visão Geral (ver); definir tetos → Lançamentos (editar).
   Rotas antigas (`/planejamento`, `/contas-fixas`) redirecionam/viram sub-rotas de Lançamentos.
5. Menu da Casa: **Visão Geral · Lançamentos · Metas** (Sidebar + BottomNav atualizados).

**Fora:** redesign visual "mais bonito" (adiado); contexto empresa (Canais/Consolidado/Dívidas) só ajusta
menu se necessário; nova funcionalidade; migração.
</domain>

<decisions>
## Implementation Decisions (do design aprovado)
- Visão Geral = **só leitura** (anti-objetivo: nenhum botão que muda dado).
- Contas fixas = **aba dentro de Lançamentos** (recomendação aceita) — leva o `ContasFixasBloco` interativo (gerar/marcar pago) pra lá; na Visão Geral fica a versão só-leitura.
- "Planejamento" **some** como item de menu; acompanhamento → Visão Geral, definir tetos → Lançamentos.
- **Metas** = item próprio (`/metas`), separado das contas fixas.
- Reaproveitar componentes: HeroPossoGastar, ContasFixasBloco, acompanhamento semanal, tetos por categoria,
  metas, TransactionSheet, gerar/marcar pago. O trabalho é **mover/compor + versão só-leitura**, não reescrever.

### Claude's Discretion
- Abas em Lançamentos: componente de tabs shadcn × sub-rotas × query `?aba=`.
- "Tetos & categorias" como 3ª aba ou seção dentro de outra aba.
- Rotas antigas: redirect 308 × sub-rota.
- Versão só-leitura: esconder botões (prop) × componente separado.
</decisions>

<canonical_refs>
## Canonical References
- `docs/superpowers/specs/2026-11-27-casa-reorganizacao-ia-design.md` — **design autoritativo**.
- `.planning/phases/11-reorganizacao-casa/11-UI-SPEC.md` — contrato de navegação/abas.
- Fase 10 (`docs/superpowers/specs/2026-11-27-casa-pago-a-pagar-design.md`) — componentes que serão movidos.
</canonical_refs>

<code_context>
## Existing Code Insights
- `src/app/(authed)/_components/{Sidebar,BottomNav}.tsx` — itens de menu por contexto (`NavItem`, `showInContext`, `hrefWith`); aqui removemos Planejamento/Contas-fixas e adicionamos Metas.
- `src/app/(authed)/visao-geral/` — page + loader + componentes (HeroPossoGastar, ContasFixasBloco, DashboardCards, renda familiar); tornar só-leitura + resumo.
- `src/app/(authed)/lancamentos/` — lista + TransactionSheet (já com status/vencimento); vira o hub com abas.
- `src/app/(authed)/contas-fixas/` — CRUD FixedAccount + metas + gastos anuais; contas fixas → Lançamentos, metas → /metas.
- `src/app/(authed)/planejamento/` — tetos por categoria + acompanhamento; acompanhamento (ver) → Visão Geral, tetos (editar) → Lançamentos; rota antiga redireciona.
- Tabs: shadcn `@radix-ui/react-tabs` já instalado (ver package.json). Navegação mobile: BottomNav.
- SEM migração; SEM mudar service/cálculo (só mover componentes e wiring de rota/menu).
</code_context>

<deferred>
## Deferred Ideas
Redesign visual "mais bonito"; abas/reorg no contexto empresa; WhatsApp (pausado); Pago e A Pagar das empresas.
</deferred>

---

*Phase: 11 — Reorganização da Casa (IA)*
*Context gathered: 2026-11-27*
