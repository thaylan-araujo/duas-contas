---
phase: 3
slug: planning
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-11-25
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 03-RESEARCH.md §Validation Architecture. A correção aritmética (regras de cálculo do spec) é a superfície crítica — deve ser coberta por funções puras testáveis sem banco.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (ASSUMED — não existe hoje; Wave 0 instala) |
| **Config file** | none — Wave 0 instala (`vitest.config.ts`) |
| **Quick run command** | `npx vitest run src/lib` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 segundos |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 segundos

---

## Per-Task Verification Map

As funções de cálculo devem ser **puras** (sem Prisma) em `src/lib/` para serem testáveis isoladamente. Tabela inicial — o planner refina por tarefa:

| Área | Requirement | Regra a validar | Test Type | Automated Command | File Exists | Status |
|------|-------------|-----------------|-----------|-------------------|-------------|--------|
| Total planejado por item | PLAN-02 | total = valor por vez × nº de semanas marcadas | unit (property) | `npx vitest run src/lib` | ❌ W0 | ⬜ pending |
| Folga | PLAN-01/03 | folga = teto − total planejado; se negativa → "passou do teto" | unit | `npx vitest run src/lib` | ❌ W0 | ⬜ pending |
| Faixas das semanas | PLAN-04 | sem1=1–7, sem2=8–14, sem3=15–21, sem4=22–fim (mês variável) | unit (property) | `npx vitest run src/lib` | ❌ W0 | ⬜ pending |
| "Gastei" automático × override | PLAN-04 | override manual tem precedência; senão soma dos lançamentos reais da categoria/semana | unit | `npx vitest run src/lib` | ❌ W0 | ⬜ pending |
| Gasto anual ÷12 | FIXA-02 | guardar/mês = valor no ano ÷ 12 (arredondamento em centavos) | unit | `npx vitest run src/lib` | ❌ W0 | ⬜ pending |
| Guardar/mês da meta | META-01 | (meta − guardado) ÷ meses até o prazo; prazo nulo/passado → sem divisão por zero | unit | `npx vitest run src/lib` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Instalar Vitest + config (`vitest.config.ts`) — nenhum framework de teste existe hoje
- [ ] `src/lib/weeks.ts` — extrair a lógica de faixas de semana (hoje embutida em `visao-geral/_lib/service.ts`) para fonte única compartilhada
- [ ] Stubs de teste para as funções de cálculo puras (planejado, folga, semanas, ÷12, guardar/mês)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fidelidade visual das telas ao PDF de design | PLAN-03/04, FIXA, META | Layout/visual não é verificável por teste unitário | Comparar `/planejamento` e `/contas-fixas` com `design/telas-duas-contas.pdf` (telas 3 e 4) |
| Contas fixas aparecem sozinhas no plano | PLAN-06 | Integração render-time derivada; validar via UAT | Cadastrar conta fixa → abrir plano do mês → ver no grupo "Contas fixas" |

*As regras de cálculo têm verificação automatizada (acima).*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (Vitest install + weeks.ts)
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
