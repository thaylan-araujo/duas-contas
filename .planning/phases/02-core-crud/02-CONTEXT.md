# Phase 2: Core CRUD - Context

**Gathered:** 2026-11-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 2 entrega as operações de CRUD de lançamentos financeiros (Casa e Empresa), o pró-labore atômico com par de lançamentos vinculados por `pairId`, o gerenciamento de categorias (criar/editar/excluir), e o dashboard da Casa com dados reais de gastos e teto do mês.

Entregáveis obrigatórios:
- Usuário pode criar, editar, excluir e listar lançamentos por conta e mês
- Usuário pode registrar pró-labore (cria saída na Empresa e entrada na Casa atomicamente, ligadas por `pairId`)
- Usuário pode criar categorias inline no formulário e gerenciar (editar/excluir) via seção "Gerenciar categorias" em /lancamentos
- Dashboard da Casa exibe 4 cartões: Teto do mês (editável inline), "--" para planejado (Fase 3), Folga (teto − gasto), Gasto até hoje
- Dashboard exibe barras de gastos por categoria e gráfico semanal (Recharts)

Fora do escopo desta fase: planejamento mensal com itens (PLAN-01, PLAN-02 — Fase 3), contas fixas e metas, dashboard da Empresa, lançamento rápido otimizado para mobile.

</domain>

<decisions>
## Implementation Decisions

### Dashboard da Casa — MonthlyBudget
- **D-01:** Adicionar modelo `MonthlyBudget` ao schema Prisma: `id (cuid), userId (FK User), month (String "YYYY-MM"), ceilingCents (Int)`. Este modelo é o único dado do planejamento necessário na Fase 2 — apenas o teto do mês. Os itens de planejamento (ItemPlano) chegam na Fase 3.
- **D-02:** Dashboard da Casa (DASH-01) exibe 4 cartões: "Teto do mês" (valor do MonthlyBudget, editável), "Planejado" (exibe "--" até a Fase 3 implementar ItemPlano), "Folga" (teto − gasto total do mês; exibe "--" se teto não definido), "Gasto até hoje" (soma de amountCents de saídas da Casa no mês selecionado).
- **D-03:** O teto é editável diretamente no cartão — clique no valor do cartão "Teto do mês" abre campo de edição in-place (input inline com `font-mono`). Confirmar com Enter ou clicar fora salva via Server Action (upsert no MonthlyBudget).
- **D-04:** Ao exibir um mês sem `MonthlyBudget` cadastrado, o sistema copia automaticamente o `ceilingCents` do mês anterior mais próximo. Se não houver histórico, usa 300000 (R$ 3.000,00) como padrão. O upsert é disparado no primeiro acesso ao mês ou quando o usuário edita o teto.

### Pró-labore — Linkagem de Par
- **D-05:** Adicionar campo `pairId: String?` ao modelo `Transaction` no Prisma. Quando um pró-labore é registrado, ambos os lançamentos (saída Empresa e entrada Casa) recebem o mesmo UUID gerado no momento da criação via `crypto.randomUUID()`. Lançamentos manuais normais têm `pairId = null`.
- **D-06:** Lançamentos com `pairId` são **bloqueados para edição individual**. A Sheet de edição, ao detectar `pairId !== null`, exibe aviso inline: "Este lançamento faz parte de um pró-labore." Os campos ficam em modo somente leitura. O único botão disponível é "Excluir pró-labore" (que exclui ambos os lançamentos do par atomicamente via `prisma.$transaction`).

### Gerenciamento de Categorias (LANC-06)
- **D-07:** Editar e excluir categorias fica disponível via seção "Gerenciar categorias" acessível a partir da página /lancamentos (link/botão discreto no cabeçalho ou rodapé da lista que abre um Sheet). O Sheet exibe a lista de categorias organizadas por conta (Casa / Empresa), com ícone de lápis (editar nome) e lixeira (excluir) por categoria. Categorias criadas pelo usuário podem ser editadas e excluídas; categorias padrão do seed são somente leitura.
- **D-08:** Exclusão de categoria é **bloqueada** se a categoria tiver lançamentos vinculados. Sistema exibe mensagem de erro: "Esta categoria tem X lançamentos e não pode ser excluída." Nenhuma reatribuição de lançamentos é realizada — operação simplesmente não prossegue.

### Claude's Discretion
- Estrutura exata da Server Action de upsert do MonthlyBudget (create vs. update — usar `upsert` nativo do Prisma com `where: { userId_month: { userId, month } }`, requer índice único)
- Como renderizar o campo inline do teto no cartão do dashboard (input controlado com `onBlur` para salvar)
- Organização interna do Sheet "Gerenciar categorias" (tabs por conta ou lista única com filtro toggle)
- Lógica de cópia automática do teto do mês anterior (Server Component carrega no render vs. Server Action acionada na primeira edição)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Regras de Negócio e Especificação
- `spec.md` — Fonte de verdade para todas as regras de negócio, telas, entidades e comportamentos do sistema. Leitura obrigatória antes de qualquer decisão de implementação.
- `telas-duas-contas.pdf` — Design visual de referência para todas as telas. (arquivo na raiz do projeto)

### UI Design Contract (Phase 2)
- `.planning/phases/02-core-crud/02-UI-SPEC.md` — Contrato visual e de interação desta fase. Cobre: formulário de lançamento (Sheet), lista de lançamentos, fluxo de exclusão com Dialog, dashboard da Casa (4 cartões + barras + gráfico Recharts), seletor de conta, copywriting completo em pt-BR, interaction states. Leitura obrigatória antes de implementar qualquer tela desta fase.

### Requisitos e Roadmap
- `.planning/REQUIREMENTS.md` — 48 requisitos v1 com IDs rastreáveis. Fase 2 cobre LANC-01, LANC-02, LANC-03, LANC-04, LANC-05, LANC-06, DASH-01, DASH-02.
- `.planning/ROADMAP.md` — Fases, dependências e critérios de sucesso.
- `.planning/PROJECT.md` — Decisões arquiteturais confirmadas, design tokens, stack completo, convenções de colocation. Consultar antes de qualquer escolha de estrutura.

### Stack e Configuração
- `.claude/CLAUDE.md` §Technology Stack — stack completo com versões, alternativas consideradas e o que NÃO usar.
- `.claude/CLAUDE.md` §Critical Configuration — variáveis de ambiente DATABASE_URL (porta 6543, pgbouncer=true) e DIRECT_URL (porta 5432).

### Contexto da Fase Anterior
- `.planning/phases/01-foundation/01-CONTEXT.md` — Decisões da Fase 1: schema Prisma inicial, padrão de Server Actions, utilitários formatBRL/formatDate, Zustand store (contaAtiva, mesSelecionado), categorias padrão seedadas.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/format.ts`: `formatBRL(cents)` e `formatDate(date)` — usar em toda exibição de valores e datas. NUNCA formatar inline.
- `src/store/conta.ts`: `useContaStore` com `contaAtiva` (CASA|EMPRESA) e `mesSelecionado` (YYYY-MM) — usar para filtrar lançamentos e passar contexto para Server Actions.
- `src/lib/prisma.ts`: singleton do PrismaClient via `globalThis` — importar SEMPRE daqui.
- Componentes shadcn instalados: `Button`, `Input`, `Label`, `Card`, `Separator`, `Sheet`, `Skeleton` em `src/components/ui/`.
- Novos componentes shadcn necessários (definidos na UI-SPEC): `Dialog`, `Select`, `Badge`, `Tabs`.

### Established Patterns
- **Feature-per-route colocation:** cada tela em `src/app/(authed)/[rota]/` com subpastas `_components/` e `_lib/` (actions.ts, service.ts, schema.ts, loader.ts).
- **Server Actions:** `parse Zod → chama service → revalidatePath`. Lógica de negócio NUNCA na action — vai em `*.service.ts`.
- **Valores monetários:** sempre Int (centavos) no banco e nos Server Actions. Converter para display APENAS com `formatBRL()`.
- **Datas:** sempre `DateTime @db.Date` no Prisma. Converter para display APENAS com `formatDate()`.
- **Client Components:** usar `'use client'` apenas para componentes interativos (forms, charts, store reads). Preferir Server Components para listas e cards.

### Integration Points
- `prisma/schema.prisma` — adicionar `MonthlyBudget` e campo `pairId` ao `Transaction` via migration.
- `src/app/(authed)/lancamentos/page.tsx` — atualmente placeholder; substituir pela lista de lançamentos com filtros e seção de categorias.
- `src/app/(authed)/visao-geral/page.tsx` — atualmente placeholder; substituir pelo dashboard da Casa.
- `src/app/(authed)/layout.tsx` — Sidebar + BottomNav já existem; lançamentos abertos via Sheet não precisam de nova rota.

</code_context>

<specifics>
## Specific Ideas

### Pró-labore
- O formulário de lançamento tem "Pró-labore" como terceira opção no Select de Tipo (além de "Entrada" e "Saída"). Ao selecionar, campo Conta desaparece (substituído por texto fixo "Saída da Empresa → Entrada na Casa") e Categoria é preenchida automaticamente com a categoria "Pró-labore" (seedada na Fase 1).
- Exclusão de pró-labore via Dialog diferenciado: "Este lançamento faz parte de um pró-labore. Ambos os lançamentos (saída da Empresa e entrada na Casa) serão excluídos."

### MonthlyBudget
- Schema: `@@unique([userId, month])` para permitir upsert idiomático do Prisma.
- Teto padrão sem histórico: 300000 centavos (R$ 3.000,00) — valor mencionado no PROJECT.md como rotina atual.

### Categorias
- Categorias padrão do seed (Fase 1) devem ser marcadas como `isDefault: Boolean @default(false)` ou controladas via ausência de `userId` — usar o approach mais simples. Categorias `isDefault=true` ou sem userId são exibidas em modo somente leitura no Sheet de gerenciamento.

</specifics>

<deferred>
## Deferred Ideas

- **Dashboard da Empresa (DASH-03, DASH-04)** — Fase 2 só implementa a visão Casa. O botão "Empresa" no seletor do dashboard fica desabilitado com tooltip "Disponível na próxima fase." Implementação real na Fase 5.
- **Lançamento rápido mobile (LANC-07)** — Tela otimizada para celular com teclado numérico e saldo restante na categoria. Fora do escopo da Fase 2.
- **"Total planejado" no dashboard** — Exibe "--" até a Fase 3 implementar ItemPlano e o planejamento detalhado.
- **Editar itens de planejamento via dashboard** — Campo de teto inline é o único dado de planejamento editável na Fase 2. Itens detalhados ficam para a Fase 3.

</deferred>

---

*Phase: 2-Core CRUD*
*Context gathered: 2026-11-23*
