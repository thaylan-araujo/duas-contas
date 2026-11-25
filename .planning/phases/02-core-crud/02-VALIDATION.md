---
phase: 02
slug: core-crud
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-11-23
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (none installed — Wave 0 must install) |
| **Config file** | `vitest.config.ts` — Wave 0 creates it |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green + manual smoke in browser
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01 | — | 1 | LANC-01 | — | userId always from session, never form data | unit | `npx vitest run tests/lancamentos/service.test.ts` | ❌ W0 | ⬜ pending |
| 02-02 | — | 1 | LANC-02 | — | userId always from session, never form data | unit | `npx vitest run tests/lancamentos/service.test.ts` | ❌ W0 | ⬜ pending |
| 02-03 | — | 1 | LANC-03 | — | pairId check blocks individual delete of pro-labore | unit | `npx vitest run tests/lancamentos/service.test.ts` | ❌ W0 | ⬜ pending |
| 02-04 | — | 1 | LANC-04 | — | loader filters by userId, account, and month | unit | `npx vitest run tests/lancamentos/loader.test.ts` | ❌ W0 | ⬜ pending |
| 02-05 | — | 1 | LANC-05 | — | both pro-labore records share same pairId, created atomically | unit | `npx vitest run tests/lancamentos/service.test.ts` | ❌ W0 | ⬜ pending |
| 02-06 | — | 2 | LANC-06 | — | delete blocked when category has linked transactions | unit | `npx vitest run tests/categorias/service.test.ts` | ❌ W0 | ⬜ pending |
| 02-07 | — | 2 | DASH-01 | — | budget falls back to previous month then to 300000 default | unit | `npx vitest run tests/visao-geral/service.test.ts` | ❌ W0 | ⬜ pending |
| 02-08 | — | 2 | DASH-02 | — | weekly spending correctly buckets transactions by week | unit | `npx vitest run tests/visao-geral/service.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/` directory
- [ ] `vitest.config.ts` — `npm install -D vitest`
- [ ] `tests/lancamentos/service.test.ts` — stubs for LANC-01, LANC-02, LANC-03, LANC-05
- [ ] `tests/lancamentos/loader.test.ts` — stubs for LANC-04
- [ ] `tests/categorias/service.test.ts` — stubs for LANC-06
- [ ] `tests/visao-geral/service.test.ts` — stubs for DASH-01, DASH-02

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sheet de lançamento abre e fecha corretamente | LANC-01 | UI interaction — no E2E framework | Abrir /lancamentos, clicar "Novo lançamento", preencher campos, confirmar |
| Dashboard exibe barras Recharts e gráfico semanal | DASH-01 | Recharts render — visual check | Acessar /visao-geral, conferir 4 cartões + barras + gráfico semanal |
| Pró-labore cria par na UI e bloqueia edição individual | LANC-05 | UI state check | Registrar pró-labore, verificar que os dois lançamentos aparecem, tentar editar um deles |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
