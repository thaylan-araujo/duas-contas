# Project Research Summary

**Project:** Duas Contas
**Domain:** Personal finance + small business (MEI/Simples Nacional) web app — Brazil
**Researched:** 2026-10-28
**Confidence:** MEDIUM

## Executive Summary

Duas Contas é uma ferramenta de finanças pessoais para um único usuário com uma distinção arquitetural rígida entre as finanças domésticas (Casa) e as da empresa (Empresa), conectadas apenas por uma transferência explícita de pró-labore. A abordagem recomendada é um app full-stack Next.js 15 App Router hospedado na Vercel, com Supabase Postgres via Prisma ORM. Essa stack é ideal para um desenvolvedor solo construindo do zero em 2026: Server Actions eliminam uma camada de API separada, Supabase provê auth e banco de dados no plano gratuito, e o PWA via @serwist/next cobre mobile sem overhead de loja de apps.

O principal diferencial do produto em relação a todos os concorrentes brasileiros (Mobills, Organizze, Qipu) é a combinação de: (1) barreira rígida Casa/Empresa com transferências de pró-labore rastreáveis, (2) sub-planejamento semanal dentro do planejamento mensal (4 cartões), (3) P&L por canal de afiliado (Shopee/Shein: comissão − anúncios = lucro, ROAS), e (4) projeção de fluxo de caixa de 3–6 meses que antecipa riscos de dívida do Pronampe e do Simples parcelado. Nenhuma dessas funcionalidades existe em conjunto em qualquer app brasileiro de consumidor.

Os principais riscos estão na camada de infraestrutura, não na lógica de domínio: má configuração do connection pooler Prisma + Supabase causa erros 500 aleatórios na Vercel invisíveis localmente; armazenar dinheiro como `Float` em JavaScript causa drift de arredondamento nos cálculos; e parsear datas sem locale explícito causa deslocamento de um dia. Os três devem ser resolvidos na Fase 1, antes de qualquer trabalho em features.

---

## Key Findings

### Stack Recomendada

A stack é Next.js 15 (App Router) + TypeScript 5 + Tailwind CSS 4 + Supabase (Postgres + Auth) + Prisma 6. Todos os componentes são releases estáveis de geração atual em 2026. Tailwind v4 usa configuração CSS-first (sem `tailwind.config.js`), builds 6× mais rápidas e é o padrão para novos projetos Next.js 15. Supabase Auth via `@supabase/ssr` substitui o pacote `auth-helpers-nextjs` depreciado. A camada PWA usa `@serwist/next`, sucessor mantido do `next-pwa`.

**Tecnologias core:**
- **Next.js 15 (App Router):** Full-stack — Server Components para leituras, Server Actions para escritas
- **TypeScript 5:** Segurança de tipos em front e back — crítico para finanças onde um tipo errado é um bug real
- **Tailwind CSS 4:** Config CSS-first, detecção de conteúdo automática, builds 6× mais rápidas
- **Supabase:** Postgres gerenciado + Auth — plano gratuito cobre o ciclo de vida deste projeto
- **Prisma 6:** ORM type-safe — requer DUAS connection strings (pooler porta 6543 em runtime, direto porta 5432 para migrations)
- **shadcn/ui + recharts + react-hook-form + zod + date-fns v3 + @serwist/next:** Camada de suporte

### Features Esperadas

**Must have (table stakes):**
- Lançamento, edição, exclusão e listagem de transações por conta e mês
- Categorias e resumo de saldo mensal
- PWA mobile-friendly, alertas de vencimento, gráficos
- Importação de extrato CSV/OFX

**Should have (diferenciadores — únicos deste produto):**
- Barreira rígida Casa/Empresa com pró-labore como única ponte permitida
- Sub-planejamento semanal (4 cartões semanais)
- Alerta DAS dia 20 embutido no calendário e fluxo de caixa
- P&L por canal de afiliado (comissões − anúncios = lucro, ROAS)
- Projeção de fluxo de caixa 3–6 meses com alerta de saldo negativo
- Barras de progresso de dívidas (Pronampe + Simples parcelamento)
- Provisionamento de gastos anuais ÷ 12 (IPVA, licenciamento)
- Metas de poupança, copiar plano do mês anterior

**Defer (v2+):**
- Modo escuro, notificações WhatsApp, Open Finance, multi-empresa, emissão NF-e

### Abordagem de Arquitetura

Estrutura feature-per-route com colocation: cada tela tem seus subdiretórios `_components/` e `_lib/` (actions, services, schemas, loaders). Queries Prisma vivem em arquivos `*.loader.ts`. Regras de negócio em `*.service.ts` (TypeScript puro, testável). Server Actions chamam services; nunca contêm lógica de negócio. Prisma client é singleton no `globalThis`. Zustand mantém `contaAtiva` (casa/empresa) persistido no localStorage.

**Componentes principais:**
1. **Route pages (RSC):** Buscam via loaders, passam props serializadas para Client Components
2. **`_lib/*.actions.ts`:** Server Actions finas — parse Zod → chama service → revalidatePath
3. **`_lib/*.service.ts`:** Lógica de negócio — barreira Casa/Empresa, validação de transferência, P&L de canal
4. **`_lib/*.loader.ts`:** Queries Prisma parametrizadas por contaId
5. **`lib/prisma.ts`:** Singleton global prevenindo esgotamento de connection pool
6. **`lib/supabase/`:** Factories de client browser/server/middleware via `@supabase/ssr`
7. **Zustand store:** `contaAtiva` + `mesSelecionado`

### Armadilhas Críticas

1. **Crash de prepared statement Prisma + Supabase pooler** — Definir `DATABASE_URL` na porta 6543 com `?pgbouncer=true&connection_limit=1`; `DIRECT_URL` na porta 5432; declarar ambas no `schema.prisma`. Nunca rodar `migrate dev` contra a porta 6543. Adicionar `"postinstall": "prisma generate"` no `package.json`.

2. **Dinheiro armazenado como float JavaScript** — Armazenar todos os valores monetários como inteiros em centavos (`Int` no Prisma, nunca `Float`). Aritmética apenas em centavos; converter para reais só na exibição via `formatBRL(centavos)`.

3. **Deslocamento de timezone em datas** — Armazenar datas como `DATE` no Postgres. Parsear com `date-fns` com formato explícito. Nunca usar `new Date('2026-10-28')`.

4. **Formatação BRL causando erros de hydration** — Sempre usar `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`. Utilitário único `formatBRL()` em todo o projeto. Definir `NEXT_LOCALE=pt-BR` na Vercel.

5. **`prisma migrate dev` em produção** — Build command: `"vercel-build": "prisma migrate deploy && next build"`.

---

## Implications for Roadmap

### Fase 1: Foundation — Infraestrutura e Auth
**Racional:** As três armadilhas críticas (config do pooler, float money, timezone de data) corrompem dados se não forem corrigidas antes de qualquer feature usar o banco. Não há caminho de recuperação depois que lançamentos são armazenados com datas erradas ou valores arredondados.
**Entrega:** Deploy Vercel funcionando, Supabase auth, schema Prisma completo, utilitários `formatBRL()`/`formatDate()`, singleton Prisma, middleware de sessão

### Fase 2: Core CRUD — Transações e Dashboard
**Racional:** Todas as outras features agregam dados de lançamento. A transferência de pró-labore reforça a regra de negócio central e deve ser construída junto com as transações.
**Entrega:** Formulário de Lançamento Rápido, lista de transações por conta+mês, transferência de pró-labore (Empresa saída + Casa entrada atômicos), dashboard Visão Geral

### Fase 3: Planning Layer — Orçamento Mensal e Cartões Semanais
**Racional:** Requer lançamentos (Fase 2) para comparação real vs planejado. Contas Fixas auto-populam o plano mensal.
**Entrega:** Plano do Mês com 4 cartões semanais, Contas Fixas, copiar plano anterior, Gastos Anuais ÷ 12, Metas com barras de progresso

### Fase 4: Empresa — Canais, Dívidas e Fluxo de Caixa
**Racional:** Requer entidade Dívida para projeção precisa de fluxo de caixa (parcelas como saídas fixas). P&L de canal é a métrica central do dashboard Empresa.
**Entrega:** Tela de P&L por canal (Shopee/Shein), barras de progresso de Dívidas com registro de pagamento, projeção de fluxo de caixa 3–6 meses com alerta negativo, Visão Geral Empresa

### Fase 5: Calendário e Alertas
**Racional:** Calendário agrega todas as fontes de eventos — deve vir após a Fase 4 (parcelas de Dívida necessárias).
**Entrega:** Calendário de vencimentos, alerta DAS dia 20, notificações push do navegador 3 dias antes
**Evita:** Armadilha 7 (iOS push requer `display-mode: standalone`)

### Fase 6: Relatório Mensal e PDF
**Racional:** Relatório requer todos os dados existentes.
**Entrega:** Relatório mensal PDF via `@react-pdf/renderer` com fontes Manrope/IBM Plex Mono registradas
**Evita:** Armadilha 6 (timeout Puppeteer na Vercel)

### Fase 7: Importação CSV/OFX
**Racional:** Requer Categoria e Conta (Fases 1–2) e entidade RegraDeImportacao.
**Entrega:** Upload CSV/OFX, parser OFX 1.x leniente (SGML Itaú), mapeamento de colunas, detecção de duplicados, Regras de Importação
**Evita:** Armadilha 9 (parser OFX rígido) e 10 (limite de tamanho de Server Action — usar Route Handler)

### Fase 8: PWA Polish
**Racional:** Não bloqueia nenhuma fase funcional; adicionar após o conjunto de features estar completo.
**Entrega:** Service worker Serwist, web app manifest, touch targets 44px, prompt de instalação iOS
**Evita:** Armadilha 12 (beforeinstallprompt no iOS) e 13 (cache iOS limpo após 7 dias)

### Ordem das Fases
- Foundation primeiro: armadilhas de infraestrutura corrompem dados permanentemente se não resolvidas antes das features
- Core CRUD antes do planejamento: cartões "Gastei R$" semanais são sem sentido sem dados reais de lançamento
- Canais após CRUD: projeção de fluxo de caixa requer parcelas de Dívida como saídas fixas
- Calendário após Empresa: calendário agrega parcelas de Dívida + Contas Fixas + DAS
- PWA por último: polimento após o conjunto de features estar completo

### Research Flags

Precisa de pesquisa mais profunda durante o planejamento:
- **Fase 4 (Canais + Fluxo de Caixa):** Algoritmo de lag de pagamento de comissão (Shopee paga ~30 dias após a venda), cálculo de ROAS com comissões variáveis
- **Fase 7 (Importação CSV/OFX):** Validar parser OFX contra arquivos reais de exportação Itaú/Bradesco/Nubank antes de planejar
- **Fase 5 (Push Notifications):** Configuração de VAPID key e eventos push Serwist no Next.js App Router precisa de spike

Padrões conhecidos (pular pesquisa durante planejamento):
- **Fase 1 (Foundation):** Completamente documentada nos docs oficiais Prisma + Supabase; seguir STACK.md exatamente
- **Fase 2 (Core CRUD):** Padrão Server Actions + Prisma documentado no ARCHITECTURE.md
- **Fase 6 (PDF):** @react-pdf/renderer com registro de fontes é um padrão conhecido

---

## Confidence Assessment

| Área | Confiança | Notas |
|------|-----------|-------|
| Stack | MEDIUM | Escolhas core confirmadas contra docs oficiais. Bibliotecas de suporte confirmadas contra consenso da comunidade. |
| Features | MEDIUM | Análise de concorrentes de 10+ fontes. Regras brasileiras específicas (DAS dia 20, lag Shopee) de docs de produto, não fontes fiscais oficiais. |
| Arquitetura | MEDIUM | Estrutura de projeto de guias da comunidade. Padrões core (Server Actions, singleton Prisma, @supabase/ssr) de docs oficiais. |
| Armadilhas | MEDIUM | Armadilhas críticas 1–5 confirmadas contra docs oficiais e post-mortems de produção. Armadilhas 6–10 de múltiplas fontes da comunidade. |

**Confiança geral:** MEDIUM

### Gaps a Resolver

- **Prisma `Int` vs `Decimal` para centavos:** PITFALLS.md recomenda `Int` (centavos); ARCHITECTURE.md usa `Decimal @db.Decimal(12,2)`. **Resolver na Fase 1: usar `Int` (centavos)** — aritmética mais simples, sem dependência Decimal.js.
- **Lag de pagamento de comissão na projeção de fluxo de caixa:** Decidir comissões geradas vs comissões recebidas antes do planejamento da Fase 4.
- **UX de entrada do valor mensal do DAS:** Fluxo exato (push notification, modal no login, evento no calendário) precisa de decisão de design na Fase 5.
- **Arquivos de teste OFX:** Abordagem de parser leniente está correta em teoria; validar com exportações reais de banco durante o spike da Fase 7.

---

## Sources

### Primary (HIGH confidence)
- Prisma ORM v6 + Supabase — official docs (prisma.io)
- Configure Prisma with PgBouncer — prisma.io
- Supabase Prisma Troubleshooting — official docs (supabase.com)
- Next.js 15 release notes — nextjs.org
- Serwist docs for Next.js — serwist.pages.dev

### Secondary (MEDIUM confidence)
- Best Personal Finance Apps in Brazil 2026 — Snabber, Focca-Ai, MaisMei
- Afiliados Shopee comissão — Shopee Blog, PuraMargem
- PDF generation on Vercel — DEV Community
- PWA iOS limitations — magicbell.com

### Tertiary (LOW confidence, needs validation)
- Prisma migrations hanging on Supabase poolers — DEV Community
- Supabase Connection Pooling on Vercel — DEV Community
- Next.js 15 App Router structure — DEV Community

---

*Research completed: 2026-10-28*
*Ready for roadmap: yes*
