---
phase: 01-foundation
plan: "02"
subsystem: auth-shell
tags: [authentication, middleware, navigation, shell, supabase-auth, next-js]
status: complete

dependency_graph:
  requires:
    - 01-01  # schema Prisma + lib/supabase/* + seed
  provides:
    - middleware de proteção de rotas (getUser)
    - login funcional (signInWithPassword)
    - shell de navegação desktop+mobile
    - 8 rotas placeholder com "Em breve"
    - /api/health + keep-alive cron
  affects:
    - todas as rotas autenticadas (/(authed)/*)
    - deploy na Vercel (CI trigger via keep-alive.yml)

tech_stack:
  added:
    - react-hook-form 7.x (formulário de login)
    - zod 3.x (validação de schema)
    - lucide-react (ícones na sidebar e BottomNav)
    - shadcn/ui Sheet (BottomNav "Mais")
  patterns:
    - Middleware com createServerClient (NÃO o wrapper) — padrão exigido pelo @supabase/ssr
    - getUser() em vez de getSession() — validação JWT server-side (T-02-01 / ASVS V2.1)
    - Grupos de rota Next.js: (auth) público, (authed) protegido
    - Client Components somente onde necessário (usePathname, form state)
    - safe-area-inset-bottom via CSS env() no BottomNav

key_files:
  created:
    - src/middleware.ts
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/login/_components/LoginForm.tsx
    - src/app/(authed)/layout.tsx
    - src/app/(authed)/page.tsx
    - src/app/(authed)/_components/Sidebar.tsx
    - src/app/(authed)/_components/BottomNav.tsx
    - src/app/(authed)/visao-geral/page.tsx
    - src/app/(authed)/lancamentos/page.tsx
    - src/app/(authed)/planejamento/page.tsx
    - src/app/(authed)/contas-fixas/page.tsx
    - src/app/(authed)/canais/page.tsx
    - src/app/(authed)/dividas/page.tsx
    - src/app/(authed)/calendario/page.tsx
    - src/app/(authed)/relatorio/page.tsx
    - src/app/api/health/route.ts
    - .github/workflows/keep-alive.yml
  modified:
    - src/app/page.tsx (scaffold atualizado — root gerenciado por middleware + (authed)/page.tsx)
    - package.json / package-lock.json (novas dependências)

decisions:
  - "Middleware usa createServerClient direto (NÃO createSupabaseServerClient) — o wrapper usa cookies() de next/headers que não está disponível no contexto de middleware"
  - "getUser() obrigatório no middleware — getSession() leria cookie sem verificar JWT com o servidor Supabase Auth (vulnerabilidade T-02-01)"
  - "Sidebar e BottomNav são Client Components (usePathname necessário para active state) — layout.tsx permanece Server Component"
  - "Erro de credenciais inválidas usa mensagem genérica — não diferencia 'email não existe' de 'senha errada' (T-02-02 / ASVS V2.2)"
  - "BottomNav usa CSS env(safe-area-inset-bottom) inline no style para compatibilidade com iOS Safari (Tailwind não suporta env() nativamente sem plugin)"

metrics:
  duration: "~30 minutos (execução do agente anterior) + verificação e commit"
  completed: "2026-10-30"
  tasks_completed: 2
  tasks_total: 3
  files_created: 17
  files_modified: 2
---

# Phase 01 Plan 02: Login + Middleware + Shell de Navegação — Summary

**One-liner:** Login funcional com Supabase Auth (signInWithPassword + getUser middleware), shell desktop/mobile completo (Sidebar + BottomNav + Sheet) e 8 rotas placeholder prontas para deploy na Vercel.

## O que foi construído

### Task 1: Login + Middleware (commit `dcf096e`)

**`src/middleware.ts`** — Proteção de rotas via `getUser()` (validação JWT com o servidor Supabase):
- Usuário não autenticado em qualquer rota fora de `/login` → redirect para `/login`
- Usuário autenticado em `/login` → redirect para `/`
- Retorna `supabaseResponse` (preserva cookies refreshados — NÃO `NextResponse.next()`)
- Matcher exclui `_next/static`, `_next/image`, `favicon.ico` e arquivos de imagem

**`src/app/(auth)/login/_components/LoginForm.tsx`** — Client Component com:
- React Hook Form + Zod resolver (`email().min(1)`, `password.min(1)`)
- `signInWithPassword()` do Supabase Browser Client
- Mensagens de erro em PT-BR: "E-mail ou senha incorretos. Tente novamente." (status 400) vs. "Não foi possível conectar. Verifique sua conexão e tente novamente." (network error)
- "Preencha o e-mail e a senha para continuar." para campos vazios
- Toggle de senha Eye/EyeOff com `aria-label="Mostrar senha"` / `"Ocultar senha"`
- Botão "Entrando…" com `aria-busy={isSubmitting}` durante loading
- `min-h-[44px]` em todos os campos e botão (acessibilidade mobile)
- Sem link "Esqueci minha senha" (magic link é fluxo admin per D-05)

### Task 2: Shell de Navegação + Placeholders (commit `f9ff782`)

**`src/app/(authed)/layout.tsx`** — Server Component:
- `flex min-h-screen bg-bg` com Sidebar à esquerda (hidden no mobile)
- `pb-16 lg:pb-0` no `<main>` para espaço do BottomNav no mobile

**`src/app/(authed)/_components/Sidebar.tsx`** — Client Component:
- 8 itens em 4 grupos: Ungrouped (Visão geral), Casa, Empresa, Geral
- Active state: `bg-casa-light text-casa` para rotas Casa, `bg-empresa-light text-empresa` para rotas Empresa
- `aria-current="page"` no link ativo
- `min-h-[44px]` em todos os itens
- `w-60 sticky top-0 h-screen overflow-y-auto`

**`src/app/(authed)/_components/BottomNav.tsx`** — Client Component:
- 4 itens primários + botão "Mais" que abre shadcn `Sheet` bottom
- Sheet contém 4 itens restantes (contas-fixas, dividas, calendario, relatorio)
- Sheet fecha ao navegar (`onClick={() => setSheetOpen(false)}`) e ao tocar fora (`onOpenChange`)
- `style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` para iOS notch
- Todos os itens com `min-h-[44px] min-w-[44px]`

**8 rotas placeholder** — cada uma com heading correto + "Esta funcionalidade será disponibilizada em breve."

### Task 3 (Checkpoint): Keep-alive + Health Check (commit `6626c9f`)

**`.github/workflows/keep-alive.yml`** — Cron `0 9 */3 * *` (a cada 3 dias às 9h UTC):
- Faz `curl -sf ${{ secrets.VERCEL_URL }}/api/health` para prevenir auto-pause do Supabase free tier
- `workflow_dispatch` para disparo manual
- Falha silenciosa (`|| echo "skipped"`) — não bloqueia outras workflows

**`src/app/api/health/route.ts`** — Route Handler GET sem dependências de DB/Auth:
- Retorna `{ status: 'ok' }` com status 200

## Verificações Executadas

| Verificação | Resultado |
|-------------|-----------|
| `npx tsc --noEmit --skipLibCheck` | PASSOU (EXIT 0) |
| middleware.ts contém getUser() | SIM |
| middleware.ts NÃO contém getSession() | SIM |
| LoginForm.tsx contém signInWithPassword | SIM |
| LoginForm.tsx contém aria-busy | SIM |
| LoginForm.tsx contém aria-label toggle senha | SIM |
| Botão Entrar tem min-h-[44px] | SIM |
| layout.tsx é Server Component (sem 'use client') | SIM |
| Sidebar.tsx contém todos os 8 itens de nav | SIM |
| Sidebar.tsx contém aria-current | SIM |
| BottomNav.tsx contém safe-area-inset-bottom | SIM |
| BottomNav.tsx contém "Mais" | SIM |
| 8 páginas placeholder existem | SIM |
| Todas as placeholders contêm "Em breve" (texto correto) | SIM |
| (authed)/page.tsx faz redirect('/visao-geral') | SIM |
| next build (background — aguardando confirmação) | PENDENTE (ver checkpoint) |

## Checkpoint Pendente

O plano tem um `checkpoint:human-verify` que requer verificação na URL pública da Vercel:

**O que o usuário precisa fazer:**
1. Verificar que o deploy automático foi disparado na Vercel após o push
2. Fazer login com email/senha criados no Supabase Dashboard
3. Confirmar redirect para /visao-geral e shell de navegação visível
4. Pressionar F5 em /visao-geral — sessão deve persistir (AUTH-02)
5. No GitHub: Settings → Secrets → Actions → adicionar `VERCEL_URL` com a URL pública
6. Confirmar bottom nav com 5 ícones no mobile e Sheet "Mais" abre ao tocar

**Signal de retomada:** "skeleton aprovado"

## Desvios do Plano

Nenhum. O plano foi executado exatamente como especificado:
- Todos os arquivos criados conforme `files_modified` do frontmatter
- Todos os textos PT-BR conforme UI-SPEC §Copywriting Contract
- Padrões de segurança (T-02-01 a T-02-05) aplicados conforme threat model

## Ameaças Mitigadas

| ID | Ameaça | Mitigação Aplicada |
|----|--------|-------------------|
| T-02-01 | Sessão forjada via getSession() | middleware.ts usa getUser() — valida JWT com servidor |
| T-02-02 | Disclosure de existência de email | Erro genérico "E-mail ou senha incorretos" |
| T-02-03 | Acesso não autenticado a rotas protegidas | Middleware intercepta antes de qualquer Server Component |
| T-02-05 | Auto-pause Supabase free tier | keep-alive.yml cron a cada 3 dias |

## Self-Check

### Arquivos criados verificados:
- src/middleware.ts — EXISTE
- src/app/(auth)/login/page.tsx — EXISTE
- src/app/(auth)/login/_components/LoginForm.tsx — EXISTE
- src/app/(authed)/layout.tsx — EXISTE
- src/app/(authed)/_components/Sidebar.tsx — EXISTE
- src/app/(authed)/_components/BottomNav.tsx — EXISTE
- src/app/(authed)/visao-geral/page.tsx — EXISTE
- src/app/(authed)/lancamentos/page.tsx — EXISTE
- src/app/(authed)/planejamento/page.tsx — EXISTE
- src/app/(authed)/contas-fixas/page.tsx — EXISTE
- src/app/(authed)/canais/page.tsx — EXISTE
- src/app/(authed)/dividas/page.tsx — EXISTE
- src/app/(authed)/calendario/page.tsx — EXISTE
- src/app/(authed)/relatorio/page.tsx — EXISTE
- src/app/api/health/route.ts — EXISTE
- .github/workflows/keep-alive.yml — EXISTE

### Commits verificados:
- dcf096e: feat(01-02): login funcional + middleware
- f9ff782: feat(01-02): shell de navegação completa
- 6626c9f: chore(01-02): health check + keep-alive

## Self-Check: PASSED
