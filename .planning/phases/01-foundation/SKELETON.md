# Walking Skeleton — Duas Contas

**Phase:** 1 — Foundation
**Generated:** 2026-10-29

## Capability Proven End-to-End

> "Um usuário autenticado consegue ver o shell de navegação (sidebar no desktop, bottom nav no mobile) acessando a URL da Vercel — provando que Next.js + Supabase Auth + Prisma + Vercel funcionam de ponta a ponta."

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 App Router (TypeScript) | Suporte nativo Vercel, Server Actions eliminam API routes para writes, Turbopack estável para dev. Versão 15.x pinada (não 16.x). |
| Estilo | Tailwind CSS v4 (CSS-first, sem config.js) | v4 default no Next 15; `@import "tailwindcss"` + `@theme` substituem o config.js; build 6x mais rápido. |
| ORM | Prisma 6.x com dual-URL (porta 6543 pooler / porta 5432 direto) | Previne crash de prepared statement no PgBouncer e travamento de migrations em advisory locks. Versão 6.x pinada (não 7.x). |
| Auth | Supabase Auth via `@supabase/ssr` (cookies httpOnly) | Cookie-based sessions funcionam em Server Components e middleware; `getUser()` no middleware valida JWT com o servidor Auth (previne cookie forjado). |
| Banco | Supabase Postgres (free tier) | Gerenciado, gratuito, integrado ao Auth. RLS recomendado em todas as tabelas. |
| Deploy | Vercel (desde o dia 1) | Zero config para Next.js; env vars configuradas no dashboard; nenhuma fase "só local". |
| Directory layout | Feature-per-route colocation em `app/(authed)/[rota]/` com `_components/` e `_lib/` | Cada tela é autossuficiente; imports por `@/` alias. |
| Valores monetários | `Int` (centavos) no Postgres via Prisma | Aritmética exata; sem drift de arredondamento de Float. |
| Datas | `DateTime @db.Date` no Prisma → Postgres `DATE` | Sem componente de hora; `formatDate()` com date-fns previne hydration mismatch de timezone. |
| State client | Zustand v5 + localStorage (`contaAtiva`, `mesSelecionado`) | Estado leve; persiste entre recargas sem depender de server state. |

## Stack Touched in Phase 1

- [x] Project scaffold — `create-next-app@15`, TypeScript, Tailwind v4, ESLint
- [x] Routing — `/login` (público) + `/(authed)/*` (protegido pelo middleware)
- [x] Database — Prisma schema pushed para Supabase; seed de categorias padrão escrito
- [x] UI — Login form funcional (email+senha → Supabase Auth → cookie → redirect)
- [x] Deployment — App na Vercel com env vars configuradas e URL pública acessível

## Out of Scope (Deferred to Later Slices)

- Qualquer tela funcional além do login e shell de navegação (todas mostram "Em breve")
- Dados de dívidas, metas, plano mensal — adicionados em Fases 3 e 4
- `displayName` do usuário — pode ser adicionado na Fase 2 ou v2
- Tema escuro — Out of Scope em REQUIREMENTS.md (v2)
- Multi-usuário / multi-empresa — Out of Scope em REQUIREMENTS.md (v2)
- PWA completo (manifest, service worker, installability) — Fase 8
- Notificações push — Fase 5
- Import de extrato — Fase 7

## Subsequent Slice Plan

Cada fase seguinte adiciona uma slice vertical sobre este skeleton sem renegociar as decisões arquiteturais:

- Fase 2: Usuário pode criar, editar, excluir e listar lançamentos de Casa e Empresa + dashboard da Casa
- Fase 3: Usuário pode planejar o mês com teto, itens, contas fixas automáticas e metas de poupança
- Fase 4: Usuário pode acompanhar P&L dos canais de afiliados, dívidas e fluxo de caixa da Empresa
- Fase 5: Usuário vê calendário de vencimentos e recebe notificações push
- Fase 6: Usuário gera e baixa relatório mensal em PDF
- Fase 7: Usuário importa extratos CSV/OFX com categorização automática
- Fase 8: PWA instalável, lançamento rápido otimizado para celular, offline support
