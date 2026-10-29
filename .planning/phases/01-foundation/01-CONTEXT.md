# Phase 1: Foundation - Context

**Gathered:** 2026-10-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy funcionando na Vercel com autenticação email/senha, schema Prisma mínimo (modelos para Fase 1+2), shell de navegação completa com placeholders, utilitários que previnem os três bugs críticos de infraestrutura (pooler, float money, timezone) e seed das categorias padrão.

Entregáveis obrigatórios:
- Usuário consegue fazer login com email/senha e a sessão persiste ao recarregar
- App acessível pela URL da Vercel sem erros 500 aleatórios
- Todos os valores monetários armazenados como `Int` (centavos) no banco
- Datas armazenadas como `DATE` no Postgres e exibidas em dd/mm/aaaa sem deslocamento de fuso
- `formatBRL()` e `formatDate()` existem como utilitários únicos
- Shell completa: sidebar no desktop, bottom navigation bar no mobile, todas as telas com placeholder "Em breve"

Fora do escopo desta fase: qualquer tela funcional além do login, dados de dívidas, metas, plano mensal.

</domain>

<decisions>
## Implementation Decisions

### Schema Prisma
- **D-01:** Schema mínimo para Fase 1+2. Criar na Fase 1: `User`, `Account` (enum), `Transaction`, `Category`. Modelos de fases posteriores (ContaFixa, GastoAnual, Meta, Canal, Divida, ItemPlano) são adicionados via migration em suas respectivas fases.
- **D-02:** Modelo `User` armazena apenas o `id` do Supabase Auth (sem campo `displayName` ou duplicação de email). Usado como FK nas demais tabelas.
- **D-03:** `Category` tem campo `account` (enum `CASA | EMPRESA`) — categorias são específicas por conta. Não existem categorias globais compartilhadas entre as duas contas.

### Autenticação e Acesso
- **D-04:** Usuário criado via Supabase Dashboard (Authentication > Users > Add user) + script `seed.ts` que cria o registro espelho no Prisma. Zero código de signup público no app.
- **D-05:** Recuperação de acesso via magic link por email (fluxo nativo do Supabase Auth). Nenhuma rota de reset customizada necessária.
- **D-06:** Proteção de rotas via `middleware.ts` global que verifica `supabase.auth.getUser()`.

### Shell de Navegação
- **D-07:** Fase 1 entrega a shell completa: sidebar no desktop com todas as seções (Visão geral, Casa → Lançamentos / Planejamento e semanas / Contas fixas e metas, Empresa → Canais e caixa / Dívidas, Geral → Calendário / Relatório mensal). Telas não implementadas mostram placeholder "Em breve".
- **D-08:** Mobile: sidebar vira bottom navigation bar (barra de ícones na parte inferior da tela). Padrão de app mobile — mais fácil de alcançar com uma mão. Compatible com PWA.

### Seeds e Dados Iniciais
- **D-09:** Script `seed.ts` da Fase 1 insere as categorias padrão de Casa e Empresa (Comida, Combustível, Lazer, Contas fixas, Outros para Casa; categorias equivalentes para Empresa). Quando Fase 2 estiver pronta, os formulários já têm categorias para selecionar.
- **D-10:** Dívidas pré-cadastradas (Pronampe, Parcelamento do Simples) são inseridas na Fase 4 junto com os modelos de dívida. Metas iniciais ("Reserva de emergência", "Caixinha do carro") são inseridas na Fase 3.

### Claude's Discretion
- Estrutura exata de pastas (feature-per-route colocation está definida em PROJECT.md, mas a organização interna de cada route pode ser decidida pelo agente de planejamento)
- Nomes exatos das categorias padrão de cada conta (usar o spec.md como referência)
- Quantidade e nomes das seções no bottom nav (priorizar as mais usadas)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Regras de Negócio e Especificação
- `spec.md` — Fonte de verdade para todas as regras de negócio, telas, entidades e comportamentos do sistema. Leitura obrigatória antes de qualquer decisão de implementação.
- `telas-duas-contas.pdf` — Design visual de referência para todas as telas. Consultar para decisões de layout, cores e componentes. (arquivo na raiz do projeto)

### Requisitos e Roadmap
- `.planning/REQUIREMENTS.md` — 48 requisitos v1 com IDs rastreáveis. Fase 1 cobre AUTH-01 e AUTH-02.
- `.planning/ROADMAP.md` — Fases, dependências e critérios de sucesso. Phase 1 §Success Criteria define o que deve ser TRUE ao final.
- `.planning/PROJECT.md` — Decisões arquiteturais confirmadas, design tokens, stack completo, convenções de colocation. Consultar antes de qualquer escolha de estrutura.

### Stack e Configuração Crítica
- `.claude/CLAUDE.md` §Technology Stack — stack completo com versões, alternativas consideradas e o que NÃO usar (shadowwalker/next-pwa, @supabase/auth-helpers-nextjs, moment.js, Pages Router).
- `.claude/CLAUDE.md` §Critical Configuration — variáveis de ambiente DATABASE_URL (porta 6543, pgbouncer=true) e DIRECT_URL (porta 5432). Esta configuração previne crash de prepared statements no Supabase pooler e travamento de migrations.
- `.claude/CLAUDE.md` §PWA Setup — configuração do @serwist/next (relevante para Fase 8, mas a estrutura do next.config deve prever o suporte desde o início).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Nenhum código existe ainda — projeto greenfield.

### Established Patterns (definidos em PROJECT.md antes do código)
- **Feature-per-route colocation:** cada tela em `app/(authed)/[rota]/` com subpastas `_components/`, `_lib/` (actions, services, schemas, loaders)
- **Prisma singleton:** `lib/prisma.ts` exporta uma instância única via `globalThis` — previne connection pool exhaustion em dev com hot reload
- **Server Actions finas:** `parse Zod → chama service → revalidatePath`. Lógica de negócio NUNCA fica na action — vai em `*.service.ts`
- **Zustand store:** `contaAtiva` (CASA | EMPRESA) e `mesSelecionado` persistidos em localStorage

### Integration Points
- Supabase Auth (`@supabase/ssr`) ↔ Next.js middleware.ts: a sessão é lida server-side via cookies, não localStorage
- Prisma migrations: sempre executar via DIRECT_URL (porta 5432), nunca via DATABASE_URL (porta 6543 — pooler bloqueia advisory locks)

</code_context>

<specifics>
## Specific Ideas

### Design tokens confirmados (de PROJECT.md)
- Fundo: `#F3F5F7`
- Cartões: branco
- Azul Casa: `#1D4ED8`
- Laranja Empresa: `#B45309`
- Fontes: Manrope (UI) + IBM Plex Mono (valores monetários)

### Categoria por conta
- O campo `account` no modelo `Category` usa o mesmo enum `ContaType` (CASA | EMPRESA) que o campo `account` em `Transaction`. Isso garante que nunca se misturem no banco.

### Utilitários críticos
- `formatBRL(centavos: number): string` — converte inteiro em centavos para "R$ 1.234,56". Único ponto de formatação monetária no sistema.
- `formatDate(date: Date): string` — formata Date para "dd/mm/aaaa" usando date-fns com locale ptBR. Único ponto de formatação de data no sistema.
- Esses dois utilitários devem existir em `lib/format.ts` e serem usados em TODA exibição de valores — nunca formatar inline.

</specifics>

<deferred>
## Deferred Ideas

- **displayName do usuário** — campo `displayName` no perfil para "Olá, Thaylan" na interface. Deferred: uso pessoal, não é crítico para MVP. Pode ser adicionado na Fase 2 ou deixado para v2.
- **Tema escuro** — explicitamente Out of Scope no REQUIREMENTS.md. Pode ser v2 se houver demanda.
- **Multi-usuário / multi-empresa** — Out of Scope no REQUIREMENTS.md. Arquitetura com `userId` em todas as tabelas permite essa evolução futura sem refactor.

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-10-29*
