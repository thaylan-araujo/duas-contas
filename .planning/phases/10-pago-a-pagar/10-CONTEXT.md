# Phase 10 — Casa: Pago e A Pagar — Context

**Gathered:** 2026-11-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Dá às despesas da **Casa** um **status (pago / em aberto) + vencimento**, faz as **contas fixas entrarem
sozinhas como "em aberto" todo mês**, e passa a **descontar tudo (fixas pagas + fixas em aberto + variável)**
do dinheiro do mês — mostrando o número "posso gastar ainda" na tela do mockup aprovado. Conserta a queixa
de que contas fixas não entravam no cálculo do saldo.

Entrega:
1. Campos de status/vencimento nas despesas (abordagem A — status no `Transaction`).
2. Geração mensal idempotente das contas fixas como lançamentos "em aberto" (ação explícita).
3. "Marcar como pago" (informando o valor real nas "a definir").
4. Cálculo do "posso gastar" somando as fixas em aberto (sem contagem dupla) — leitores de gasto real/semanal/tetos seguem só `PAGO`.
5. Despesa avulsa também pode ser lançada "em aberto" com vencimento.
6. Tela da Casa no formato do mockup (upgrade de Visão Geral/Planejamento).

**Fora:** "a receber" das empresas; alertas de vencimento (Fase 5 — Calendário); projeção futura baseada nos a-pagar; geração de parcelas.
</domain>

<decisions>
## Implementation Decisions (do design aprovado 2026-11-27)

- **A (modelagem):** status no próprio `Transaction` — `status` enum (`PAGO`|`EM_ABERTO`, default `PAGO`),
  `dueDate` Date?, `estimatedCents` Int?, `fixedAccountId` String?. Migração **aditiva**.
- **FixedAccount:** novo `isVariableAmount` Boolean (luz/água = "a definir").
- **Geração mensal:** ação explícita (Server Action/botão), `date = dueDate`, idempotente por (`fixedAccountId` + mês); "a definir" usa estimativa = valor PAGO do mês anterior daquela conta.
- **R-1:** só o hero soma `EM_ABERTO`; gasto real/semanal/tetos filtram `PAGO`. `EM_ABERTO` nesta fase só existe para Casa; empresas intactas (default `PAGO`).
- **R-2:** `posso gastar = entradas − [Σ pagos + Σ em aberto(valor real ou estimativa)]`; transição em aberto→pago é a MESMA linha (sem duplicar).
- **R-4:** `/contas-fixas` continua como lugar de definir fixas (com o toggle `isVariableAmount`); apagar fixa não apaga histórico (SetNull em `fixedAccountId`).
- **Escopo (travado):** fixas **e** despesas avulsas podem ficar "em aberto" (toggle pago/em aberto + vencimento no formulário de lançamento; "marcar pago" genérico). Default = pago.
- **Visual:** hero "posso gastar ainda" (mockup aprovado) é o número de topo.

### Claude's Discretion
- Onde a geração dispara (botão × ao abrir o mês) e UX do "marcar pago".
- Em qual rota os blocos moram (Visão Geral × Planejamento × aba nova).
- Nomes finais de enum/campos; índice/guarda de idempotência.
- "A definir" sem mês anterior (estimativa 0 / pedir valor).
</decisions>

<canonical_refs>
## Canonical References
- `docs/superpowers/specs/2026-11-27-casa-pago-a-pagar-design.md` — **design autoritativo** (ler primeiro; inclui §10 decisões da revisão R-1..R-5).
- Mockup aprovado: `.superpowers/brainstorm/.../casa-mes.html` (visão do mês da Casa).
- `docs/superpowers/specs/2026-11-25-casa-acompanhamento-design.md` — Casa atual (dinheiro do mês, tetos, semanal) que esta fase estende.
</canonical_refs>

<code_context>
## Existing Code Insights
- `prisma/schema.prisma` — `Transaction` (Casa = empresaId null), `FixedAccount`, `Category` (categoria Casa "Contas fixas" existe no seed), `MonthlyBudget`, `CategoryBudget`.
- `src/app/(authed)/visao-geral/_lib/{service,loader}.ts` — `getTotalEntradas` (dinheiro do mês), `getTotalSpent`, `restanteCents` (aqui entra o hero "posso gastar"); **adicionar filtro `status=PAGO` nos leitores de gasto real e somar em aberto só no hero**.
- `src/app/(authed)/planejamento/_lib/{acompanhamento,service,loader}.ts` — `computeRestanteMes`, `getWeeklySpending`, `getCategorySpending` (tetos/semanal → filtrar `PAGO`).
- `src/app/(authed)/contas-fixas/` — CRUD de FixedAccount (adicionar toggle `isVariableAmount`; origem da geração mensal).
- `src/app/(authed)/lancamentos/_lib/{schema,service,actions}.ts` + `TransactionSheet.tsx` — formulário ganha toggle pago/em aberto + vencimento; `createTransactionService` passa a aceitar status/dueDate.
- `src/lib/format.ts` (formatBRL/formatDate). Vitest para funções puras (cálculo do comprometido/estimativa). Migração aditiva: backup, DIRECT_URL, nunca shadow-db no banco real.
</code_context>

<deferred>
## Deferred Ideas
"A receber" das empresas; alertas/notificações de vencimento (Calendário, Fase 5); projeção de caixa pelos a-pagar; geração automática de parcelas; status no WhatsApp.
</deferred>

---

*Phase: 10 — Casa: Pago e A Pagar*
*Context gathered: 2026-11-27*
