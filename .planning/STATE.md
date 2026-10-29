---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Not started
stopped_at: Phase 1 UI-SPEC approved
last_updated: "2026-10-29T12:13:01.048Z"
progress:
  total_phases: 8
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State: Duas Contas

**Last updated:** 28/10/2026
**Session:** Initial roadmap creation

---

## Project Reference

**Core Value:** A Casa e a Empresa nunca se misturam — dinheiro só passa de uma para outra como pró-labore, registrado como transferência explícita.

**Current Focus:** Phase 1 — Foundation (infraestrutura, auth, Prisma schema, utilitários críticos)

---

## Current Position

**Active Phase:** Phase 1 — Foundation
**Active Plan:** None (not started)
**Status:** Not started

```
Progress: [ Phase 1 ][ Phase 2 ][ Phase 3 ][ Phase 4 ][ Phase 5 ][ Phase 6 ][ Phase 7 ][ Phase 8 ]
            ^current
```

**Phases complete:** 0/8
**Requirements delivered:** 0/48

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases complete | 0/8 |
| Plans complete | 0/? |
| Requirements delivered | 0/48 |
| Build passing | Unknown |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Supabase + Prisma desde a Fase 1 | Deploy online na Vercel desde o início; evita migração posterior | Confirmed |
| Next.js 15 App Router + TypeScript | Base única para telas e servidor; suporte nativo Vercel | Confirmed |
| PWA via @serwist/next | Mobile sem publicar em loja; custo zero | Confirmed |
| Valores em centavos como Int (não Float) | Aritmética exata sem drift de arredondamento | Confirmed |
| DATABASE_URL porta 6543 com pgbouncer=true; DIRECT_URL porta 5432 | Previne crash de prepared statement no Supabase pooler | Confirmed |
| Datas como DATE no Postgres, parsear com date-fns formato explícito | Previne deslocamento de timezone | Confirmed |
| `formatBRL()` e `formatDate()` como utilitários únicos | Previne erros de hydration no SSR | Confirmed |

### Architecture Notes

- Feature-per-route com colocation: cada tela tem `_components/`, `_lib/` (actions, services, schemas, loaders)
- Prisma client como singleton em `globalThis` (`lib/prisma.ts`)
- Supabase Auth via `@supabase/ssr` (substitui `auth-helpers-nextjs` depreciado)
- Server Actions finas: parse Zod → chama service → `revalidatePath`
- Lógica de negócio em `*.service.ts` (TypeScript puro, testável)
- Zustand store: `contaAtiva` (casa/empresa) + `mesSelecionado` persistidos em localStorage
- Design: fundo #F3F5F7, cartões brancos, azul Casa #1D4ED8, laranja Empresa #B45309, fontes Manrope + IBM Plex Mono

### Research Flags (to address during planning)

- **Phase 4**: Algoritmo de lag de pagamento Shopee (~30 dias); decidir "comissões geradas" vs "comissões recebidas" antes de planejar
- **Phase 5**: Spike de VAPID key + eventos push Serwist no Next.js App Router antes de planejar
- **Phase 7**: Validar parser OFX contra arquivos reais de exportação Itaú/Bradesco/Nubank antes de planejar

### Open Questions

- Prisma `Int` vs `Decimal` para centavos: resolver na Fase 1 (recomendação: `Int` — aritmética mais simples, sem dependência Decimal.js)
- UX de entrada do valor mensal do DAS: decidir na Fase 5 (push notification, modal no login, evento no calendário)

### Blockers

None.

### Todos

- [ ] Iniciar planejamento da Fase 1 com `/gsd-plan-phase 1`

---

## Session Continuity

**Last session:** 2026-10-29T12:13:01.032Z
**Stopped at:** Phase 1 UI-SPEC approved
**Resume file:** .planning/phases/01-foundation/01-UI-SPEC.md

**To resume this project:**

1. Ler `ROADMAP.md` para ver o estado das fases
2. Ler `PROJECT.md` para contexto do domínio
3. Ler `spec.md` para regras de negócio detalhadas
4. Confirmar a fase atual no campo "Active Phase" acima
5. Executar `/gsd-plan-phase <N>` para a próxima fase

**Critical files:**

- `.planning/PROJECT.md` — contexto do projeto e decisões arquiteturais
- `.planning/REQUIREMENTS.md` — todos os requisitos v1 com traceabilidade
- `.planning/ROADMAP.md` — fases, critérios de sucesso e cobertura
- `spec.md` — fonte de verdade das regras de negócio
- `design/telas-duas-contas.pdf` — telas de referência visual

---

*State initialized: 28/10/2026*
