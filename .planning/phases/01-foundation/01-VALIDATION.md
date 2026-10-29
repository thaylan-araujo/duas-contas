---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-29
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No test runner yet — greenfield project. Wave 0 installs TypeScript strict mode. |
| **Config file** | `tsconfig.json` (Wave 0 creates with `"strict": true`) |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx next lint && npx prisma validate` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx next lint && npx prisma validate`
- **Before `/gsd-verify-work`:** Full suite must be green + `npx next build` passes + manual browser test on Vercel URL
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-scaffold | TBD | 1 | AUTH-01 | T-01-auth | Login route requires Supabase session | Build | `npx next build` | ❌ Wave 0 | ⬜ pending |
| 01-auth-middleware | TBD | 1 | AUTH-01 | T-01-auth | `getUser()` not `getSession()` in middleware.ts | Manual | `grep -r "getUser" src/middleware.ts` | ❌ Wave 0 | ⬜ pending |
| 01-auth-session | TBD | 1 | AUTH-02 | T-01-auth | Session persists after reload (httpOnly cookie) | Manual (browser) | — | ❌ Wave 0 | ⬜ pending |
| 01-format-brl | TBD | 1 | — | — | N/A | Unit | `npx ts-node -e "import {formatBRL} from './src/lib/format'; console.assert(formatBRL(12345)==='R$ 123,45')"` | ❌ Wave 0 | ⬜ pending |
| 01-format-date | TBD | 1 | — | — | N/A | Unit | `npx ts-node -e "import {formatDate} from './src/lib/format'; console.assert(formatDate(new Date('2026-11-01T12:00:00Z'))==='01/11/2026')"` | ❌ Wave 0 | ⬜ pending |
| 01-prisma-schema | TBD | 1 | — | — | N/A | Build | `npx prisma validate` | ❌ Wave 0 | ⬜ pending |
| 01-int-cents | TBD | 1 | — | — | N/A | Build | `grep "Float" prisma/schema.prisma` must return empty | ❌ Wave 0 | ⬜ pending |
| 01-vercel-deploy | TBD | 2 | AUTH-01 | — | App accessible without 500 errors | Manual | Vercel deployment URL loads without error | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tsconfig.json` — strict mode enabled (`"strict": true`)
- [ ] `src/lib/format.ts` — `formatBRL()` and `formatDate()` functions (Wave 0 stub, Wave 1 implements)
- [ ] `.env.local.example` — template with `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `.gitignore` — includes `.env.local` exclusion
- [ ] `prisma/schema.prisma` — minimal schema for Phase 1+2 with `Int` cents, `@db.Date` annotations

*No test framework install needed in Phase 1 — build + type-check + manual verification is sufficient.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Login with email+password succeeds | AUTH-01 | Requires Supabase Auth network call; no mock layer in Phase 1 | 1. Open Vercel URL. 2. Enter credentials created in Supabase Dashboard. 3. Verify redirect to dashboard. |
| Session persists on page reload | AUTH-02 | Requires browser cookie inspection | 1. Log in. 2. Hard-reload (Ctrl+Shift+R). 3. Verify still logged in. 4. Open DevTools > Application > Cookies and confirm `sb-*` cookie exists. |
| Sidebar shows all navigation sections | — | Visual layout check | Open app in desktop browser and verify: Visão geral, Casa (Lançamentos, Planejamento, Contas fixas), Empresa (Canais, Dívidas), Geral (Calendário, Relatório) |
| Bottom nav appears on mobile | — | Visual/responsive check | Open app on mobile or DevTools mobile emulation and verify bottom navigation bar replaces sidebar |
| Unauthed routes redirect to login | AUTH-01 | Requires browser redirect test | Open `/dashboard` URL without being logged in and verify redirect to `/login` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
