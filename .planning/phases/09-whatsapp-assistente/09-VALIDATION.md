---
phase: 09
slug: whatsapp-assistente
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-11-26
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest.config.ts (existing) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

> Filled by the planner. Pure functions (extraction→lançamento mapping, destino/categoria
> resolution, PT-BR valor/data parsing) get unit tests; webhook idempotency + pending-action
> flow get integration tests with a mocked Evolution payload and a mocked Anthropic client.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 0 | — | T-09-01 | allowlist rejects unknown number | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for the pure extraction/resolution functions (RED before implementation)
- [ ] Mocked Evolution webhook payload fixture + mocked Anthropic client
- [ ] vitest already installed — no framework install needed

*Existing vitest infrastructure covers the pure-function and handler tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mensagem real do WhatsApp cria lançamento e recebe resposta | Critério 1 | Depende da Evolution real + número do bot | Enviar "gastei 50 de gasolina na Casa" ao número do bot e conferir o lançamento + a resposta |

*Fluxo ponta-a-ponta com a Evolution real é manual; a lógica interna é automatizada.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
