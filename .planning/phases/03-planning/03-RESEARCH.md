# Phase 3: Planning (Planejamento e semanas da Casa) - Research

**Researched:** 25/11/2026
**Domain:** Prisma data modeling + financial calculation (orçamento mensal, bucketização semanal, contas fixas derivadas, metas) sobre Next.js 15 App Router / Supabase
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (Itens do plano × semanas):** Cada item do plano marca **explicitamente** em quais das 4 semanas ele cai (ex.: mercado nas semanas 2, 3 e 4). O "número de vezes" = quantidade de semanas marcadas. "Valor por vez" é o valor de cada ocorrência; **total do item = valor por vez × nº de semanas marcadas**. Semanas fixas do mês: semana 1 = dias 1–7, 2 = 8–14, 3 = 15–21, 4 = 22 até o fim do mês (spec §Cálculos).
- **D-02 ("Gastei R$" dos cartões semanais):** O "Gastei R$" de cada semana é **preenchido automaticamente** pela soma dos lançamentos reais (`Transaction` da Casa, mesma categoria, com `date` dentro da faixa daquela semana no mês selecionado), **com opção de sobrescrever manualmente**. Persistir o override manual (valor opcional); exibição = override manual, se houver, senão a soma automática. Restante = planejado − gastei.
- **D-03 (Grupo do item = Categoria existente):** O "grupo" de cada item do plano **reaproveita as Categorias da Casa existentes** (Alimentação, Combustível, Lazer, Contas fixas, Outros) — não cria um conceito separado de grupo. Isso garante o casamento com os lançamentos reais no cálculo automático do "Gastei" (D-02). O resumo por grupo (PLAN-03) agrega os itens por categoria.
- **D-04 (Plano inicial e cópia entre meses):** O **primeiro mês** (sem plano e sem histórico anterior) vem **pré-preenchido** com a rotina do spec: Compra do mês R$ 1.000 ×1 (semana 1), Mercado R$ 250 ×3 (semanas 2–4), Combustível R$ 100 ×4, Lazer R$ 150 ×4, Outros R$ 0. Meses seguintes começam **vazios**; o usuário traz o plano anterior pelo botão **"Copiar plano do mês anterior"** (PLAN-05). Diferente do teto (`MonthlyBudget`, que auto-copia do mês anterior — D-04 da Fase 2), os itens do plano exigem ação explícita.
- **D-05 (Contas fixas e gastos anuais):** **Conta fixa** (`FixedAccount`: nome, dia de vencimento, valor, flag de débito automático) entra **automaticamente** no plano do mês no grupo "Contas fixas", sem redigitar (PLAN-06). **Gasto anual** (`AnnualExpense`: nome, valor no ano, mês de vencimento) e **Meta** são **entidades separadas** (decisão do usuário). O gasto anual apenas **exibe** "guardar por mês" = valor no ano ÷ 12; não vira meta automaticamente.
- **D-06 (Metas de poupança):** **Meta** (`Goal`: nome, valor da meta, valor guardado, prazo) com barra de progresso e "guardar por mês" = (meta − guardado) ÷ meses até o prazo (spec §Cálculos). Seed de duas metas (META-02): **"Reserva de emergência"** e **"Caixinha do carro"**, apenas com o **nome** — valor-alvo, guardado e prazo em branco/zerados para o usuário preencher.

### Claude's Discretion
- Estrutura exata e nomes dos novos modelos Prisma (item do plano, `FixedAccount`, `AnnualExpense`, `Goal`) e campos.
- Como persistir o override manual do "Gastei" (campo opcional no item semanal vs. tabela dedicada).
- Layout exato das telas (tabela de planejamento, 4 cartões semanais, seções de contas fixas / gastos anuais / metas) — seguir o PDF de design e o UI-SPEC desta fase.
- Como o cartão "Planejado" do dashboard da Casa passa a puxar o total planejado (soma dos itens do mês) — hoje mostra "--".
- Lógica de pré-preenchimento do primeiro mês (seed no primeiro acesso vs. no render do Server Component).

### Deferred Ideas (OUT OF SCOPE)
- **Família multiusuário + gastos por pessoa** — controlar gastos da família + gastos individuais (Thaylan / Ligiane), com barra de "quanto ainda resta" por pessoa. Hoje o app é de 1 login; adiciona dimensão "pessoa/dono" e mexeria em AUTH. → Revisar roadmap.
- **Múltiplas empresas (3) com visão individual** (Elite Juris, Infoproduto, Achadinhos) — negócios distintos, muda o modelo de dados da Empresa. → Revisão dedicada de spec/roadmap (Fases 4+).
- **Reserva de emergência e metas para a Empresa** — metas hoje são só da Casa. → Fase 4+.
- **Projeção de "quanto vai sobrar" (pessoal/família)** — visão forward-looking pessoal. → Futuro.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAN-01 | Definir o teto de gastos do mês (padrão R$ 3.000) | Reutiliza `MonthlyBudget` + `getOrCreateMonthlyBudget` (Fase 2); fallback R$ 3.000 já implementado. Edição inline dentro do card Resumo (UI-SPEC) |
| PLAN-02 | Criar itens com nome, grupo, valor por vez, repetições; total e % do teto | Modelo `PlanItem` (4 booleanas de semana — D-01); `computePlanSummary`/`countWeeks` puros (Code Examples); Zod rejeita 0 semanas (Pitfall 2) |
| PLAN-03 | Resumo: total planejado, folga, barra por grupo | `folga = teto − total` (spec §Cálculos); barra **segmentada** manual (não `Progress` nativo) — ver Alternatives |
| PLAN-04 | 4 cartões semanais (1–7/8–14/15–21/22–fim) com "Gastei R$" e restante | `src/lib/weeks.ts` (Pattern 4, extraída de `getWeeklySpending`); `getAutoGastei` + override nullable (D-02, Pitfall 4) |
| PLAN-05 | Copiar plano do mês anterior com um botão | Server Action lê `PlanItem` do mês anterior e recria (Pattern 2, D-04); copia só itens persistidos (A5) |
| PLAN-06 | Contas fixas entram automaticamente no grupo "Contas fixas" | Linhas **derivadas em render**, não persistidas (Pattern 3, D-05); ícone `Lock` somente-leitura (UI-SPEC) |
| FIXA-01 | Cadastrar conta fixa (nome, dia venc., valor, débito automático) | Modelo `FixedAccount`; shadcn `Switch` para débito automático; Zod dia 1–31 |
| FIXA-02 | Gasto anual (valor no ano, mês venc.); guardar/mês = ÷12 | Modelo `AnnualExpense`; `computeAnnualMonthly` = `Math.round(yearly/12)` (só exibição — D-05, Pitfall 1) |
| META-01 | Meta (nome, alvo, guardado, prazo); barra + guardar/mês | Modelo `Goal`; `computeGoalMonthly` = (meta−guardado)/meses (Pitfall 3 trata prazo nulo/passado); shadcn `Progress` ou barra manual |
| META-02 | Seed de "Reserva de emergência" e "Caixinha do carro" | `getOrCreate` no 1º acesso (Pattern 2, A4) ou `prisma/seed.ts`; nascem sem valores (D-06) |
</phase_requirements>

## Summary

Esta fase **não introduz tecnologia nova** — toda a stack já está travada, instalada e provada em código pelas Fases 1–2 (Next.js 15 App Router, Prisma 6 + Supabase, Zod, react-hook-form, Recharts, Tailwind v4, shadcn/ui). O verdadeiro trabalho de pesquisa aqui é de **modelagem de dados** (4 novos modelos Prisma) e, acima de tudo, de **correção aritmética**: as regras de cálculo do spec (total = valor × nº de semanas marcadas, folga = teto − planejado, faixas de semana 1–7/8–14/15–21/22–fim, guardar/mês = (meta−guardado)/meses, anual ÷ 12) são a superfície crítica. Erros aqui são silenciosos e corrompem a confiança do usuário num app financeiro — por isso a seção de Validação (Nyquist) foca property-based/edge-case nessas fórmulas.

Os padrões arquiteturais já estão canonizados no repo e **devem ser reaproveitados sem reinvenção**: Server Actions finas (`parse Zod → getUserId da sessão → service → revalidatePath`), lógica de negócio em `*.service.ts` TypeScript puro e testável, feature-per-route com colocation (`_components/`, `_lib/{actions,service,schema,loader}.ts`), `formatBRL`/`formatDate` únicos, store Zustand (`mesSelecionado`). A função de bucketização semanal **já existe** em `visao-geral/_lib/service.ts` (`getWeeklySpending`) e sua lógica de faixas (`day <= 7 ... else`) é a referência canônica a extrair/reutilizar para o cálculo do "Gastei" automático (D-02).

As únicas decisões abertas (Claude's Discretion) são de **shape de schema** e de **onde derivar vs. persistir**: (1) como representar as 4 semanas de um item do plano; (2) como persistir o override manual do "Gastei"; (3) contas fixas entram no plano como linhas **derivadas em tempo de render** (não persistidas como itens do plano — evita duplicação e dessincronia); (4) pré-preenchimento do primeiro mês e seed das 2 metas.

**Primary recommendation:** Reaproveitar integralmente os padrões Fase 2. Adicionar 4 modelos Prisma (`PlanItem`, `WeeklySpend`, `FixedAccount`, `AnnualExpense`, `Goal` — ver Standard Stack). Representar as semanas de um `PlanItem` como **4 colunas booleanas** (`week1..week4`) — simples, type-safe, sem parsing de arrays. Derivar contas fixas no plano em tempo de render (não persistir). Pré-preencher o primeiro mês via **service no primeiro acesso** (padrão `getOrCreate*`, igual a `getOrCreateMonthlyBudget`), e semear as 2 metas no mesmo ponto. Extrair a função de faixa de semana para `src/lib/weeks.ts` compartilhada e cobri-la com testes de propriedade (fevereiro, meses de 30/31 dias, bordas de dia).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Persistência de itens do plano / contas fixas / gastos anuais / metas | Database / Storage (Prisma + Supabase) | — | Dados do usuário escopados por `userId` + `month`; padrão idêntico a `MonthlyBudget` |
| Cálculo total/folga/% do teto/semana/guardar-por-mês | API / Backend (`*.service.ts` TS puro) | — | Regras de negócio puras, determinísticas, testáveis fora do React; nunca no cliente |
| Mutações (criar/editar/excluir item, conta fixa, gasto anual, meta; salvar "Gastei") | API / Backend (Server Actions) | Database | Server Action fina: parse Zod → service → revalidatePath; `userId` sempre da sessão |
| Bucketização semanal do "Gastei" automático (soma de Transactions por faixa de data) | API / Backend (`*.service.ts`) | Database | Agregação sobre `Transaction` já no servidor; faixa de semana é lógica pura reaproveitável |
| Render da tabela do plano, 4 cartões semanais, cards de meta/conta fixa | Frontend Server (SSR, Server Components) | Browser/Client | Server Component carrega dados; subcomponentes interativos (`Input` inline, `Checkbox`, `Sheet`) são Client Components |
| Edição inline (teto, "Gastei R$"), Sheets, Checkbox de semanas, Switch | Browser / Client (`'use client'`) | — | Estado de UI e handlers de evento exigem runtime do cliente |
| Barra segmentada por grupo / barra de progresso de meta | Browser / Client | — | Render puramente visual a partir de dados já calculados no servidor |
| Pré-preenchimento do 1º mês + seed de 2 metas | API / Backend (`*.service.ts` getOrCreate) | Database | Idempotente, no primeiro acesso ao mês/recurso; mesmo padrão de `getOrCreateMonthlyBudget` |

## Standard Stack

> **Nenhuma biblioteca nova de runtime.** A stack está travada em `.claude/CLAUDE.md` e já instalada. As únicas adições são 4 componentes shadcn/ui (copiados para o repo) + 3 peers Radix que eles puxam.

### Core (já instalado — reutilizar)
| Library | Version (instalada) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.19.3 | ORM + migrations dos 4 novos modelos | `[VERIFIED: package.json]` Travado no projeto; migrations via DIRECT_URL (5432) |
| @prisma/client | 6.19.3 | Queries type-safe dos novos modelos | `[VERIFIED: package.json]` Singleton em `src/lib/prisma.ts` |
| zod | 3.25.76 | Validação dos schemas de item/conta fixa/gasto anual/meta | `[VERIFIED: package.json]` Mesmo schema client+server (sem drift) |
| react-hook-form | 7.91.0 | Estado dos formulários nos Sheets | `[VERIFIED: package.json]` Com `@hookform/resolvers` 6.0.2 (zod resolver) |
| date-fns | 3.6.0 | Faixas de semana, meses até prazo, locale pt-BR | `[VERIFIED: npm ls]` `getDaysInMonth`, `lastDayOfMonth`, `isWithinInterval`, `differenceInCalendarMonths` confirmados presentes |
| recharts | 3.11.1 | Gráfico semanal (já em uso na Fase 2) | `[VERIFIED: package.json]` **Nota:** instalado é **3.x**, não 2.x como diz o CLAUDE.md — ver State of the Art |
| zustand | 5.0.16 | `mesSelecionado`/`contaAtiva` persistidos | `[VERIFIED: package.json]` Filtrar plano pelo mês selecionado |

### Supporting (novos componentes shadcn/ui — copiar via CLI)
| Component | Registry | Purpose | Peer dep puxado |
|-----------|----------|---------|-----------------|
| `checkbox` | shadcn oficial | Marcar em quais das 4 semanas o item cai (D-01) | `@radix-ui/react-checkbox` 1.4.1 |
| `switch` | shadcn oficial | Flag "débito automático" da conta fixa (FIXA-01) | `@radix-ui/react-switch` 1.4.1 |
| `progress` | shadcn oficial | Barra de progresso das metas (META-01) | `@radix-ui/react-progress` 1.2.1 |
| `table` | shadcn oficial | Tabela de itens do plano / contas fixas / gastos anuais (desktop) | nenhum (HTML puro) |

`[VERIFIED: ui.shadcn.com registry]` — os 4 nomes (`checkbox`, `switch`, `progress`, `table`) retornam JSON válido do registry oficial. `table.json` não tem dependências Radix (é `<table>` HTML estilizado).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn `Progress` (Radix) | Barra manual `<div h-2 rounded-full bg-border>` + `bg-casa` (padrão Fase 2) | UI-SPEC permite **ambos**; a barra manual já é usada no dashboard e evita +1 peer Radix. Recomendação: barra manual para a barra-por-grupo (precisa ser **segmentada**, o que `Progress` não faz nativamente), e `Progress` (ou manual) para a barra de meta simples |
| shadcn `Table` | `<div>` grid manual | `Table` dá semântica `<th scope>` de graça (a11y do UI-SPEC); no mobile vira cartões-lista de qualquer forma |
| 4 colunas booleanas no `PlanItem` | `Int[]` (array de semanas) ou bitmask `Int` | Boolean é type-safe no Prisma, legível no Studio e trivial de validar no Zod; `Int[]` exige Postgres array + parsing; bitmask é compacto mas opaco. **Recomendação: 4 booleanas** |

**Installation:**
```bash
# Componentes shadcn (copiam código para src/components/ui/ e instalam peers Radix)
npx shadcn@latest add checkbox switch progress table

# (equivalente manual, caso o CLI não resolva os peers:)
npm install @radix-ui/react-checkbox @radix-ui/react-switch @radix-ui/react-progress
```

**Version verification:** `[VERIFIED: npm view]` em 25/11/2026 — `@radix-ui/react-checkbox` 1.4.1, `@radix-ui/react-switch` 1.4.1, `@radix-ui/react-progress` 1.2.1. date-fns 3.6.0 confirmado via `npm ls`.

## Package Legitimacy Audit

> Esta fase instala 3 peers Radix (via `npx shadcn add`). Os componentes shadcn em si são **código copiado para o repo**, não pacotes npm.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| @radix-ui/react-checkbox | npm | publicado 12/10/2026 | 66.2M/sem | github.com/radix-ui/primitives | OK | Aprovado |
| @radix-ui/react-switch | npm | publicado 12/10/2026 | 65.3M/sem | github.com/radix-ui/primitives | OK | Aprovado |
| @radix-ui/react-progress | npm | publicado 12/10/2026 | 58.9M/sem | github.com/radix-ui/primitives | OK | Aprovado |

`[VERIFIED: gsd-tools package-legitimacy + npm view]` — todos `verdict: OK`, repo oficial radix-ui, `postinstall: null`, não deprecados.

**Packages removed due to [SLOP] verdict:** nenhum
**Packages flagged as suspicious [SUS]:** nenhum

## Architecture Patterns

### System Architecture Diagram

```
                    Browser (Client Components: 'use client')
   ┌────────────────────────────────────────────────────────────────┐
   │  Sheet (criar/editar item) ── Checkbox×4 semanas (D-01)          │
   │  Input inline "Gastei R$" (D-02) ── Switch débito automático      │
   │  mesSelecionado (Zustand) ──┐                                     │
   └──────────────┬──────────────┼────────────────────────────────────┘
                  │ (form submit) │ (lê mês)
                  ▼               ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  Server Action (actions.ts)                                      │
   │  parse Zod ─► getUserId(sessão Supabase) ─► service ─► revalidate │
   └──────────────┬───────────────────────────────────────────────────┘
                  ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  service.ts (TS puro, testável)                                  │
   │  • getOrCreatePlan(userId, month) → pré-preenche 1º mês (D-04)    │
   │  • computePlanSummary() total=Σ(valor×nºsemanas), folga=teto−total│
   │  • computeWeeks() faixa 1-7/8-14/15-21/22-fim  ◄── src/lib/weeks  │
   │  • getAutoGastei(cat,semana) = Σ Transaction CASA na faixa (D-02) │
   │  • getFixedAccountsAsPlanRows() ◄── DERIVADO, não persistido (D-05)│
   │  • computeGoalMonthly() = (meta−guardado)/mesesAtéPrazo (D-06)     │
   │  • computeAnnualMonthly() = valorAno / 12 (D-05)                  │
   └──────────────┬───────────────────────────────────────────────────┘
                  ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  Prisma (singleton) ─► Supabase Postgres (pooler 6543)           │
   │  Novos modelos: PlanItem, WeeklySpend?, FixedAccount,            │
   │                 AnnualExpense, Goal   (todos escopados userId)   │
   │  Reutilizados: MonthlyBudget (teto), Transaction (Gastei auto),  │
   │                Category (grupo do item = categoria da Casa, D-03)│
   └──────────────────────────────────────────────────────────────────┘

   Server Component page.tsx (SSR)
   ├─ loader.ts → Promise.all([getOrCreatePlan, summary, weeks, fixed, goals, annual])
   └─ renderiza tabela + resumo + 4 cartões semanais + seções de contas/metas
```

### Recommended Project Structure
```
src/
├── lib/
│   └── weeks.ts                        # NOVO: faixa de semana compartilhada (extraída de getWeeklySpending)
├── app/(authed)/
│   ├── planejamento/
│   │   ├── page.tsx                    # Server Component (substitui stub)
│   │   ├── _components/                # Table do plano, 4 WeekCards, ResumoPlano, Sheet de item
│   │   └── _lib/{actions,service,schema,loader}.ts
│   ├── contas-fixas/
│   │   ├── page.tsx                    # Server Component (substitui stub) — 3 cards: fixas, anuais, metas
│   │   ├── _components/                # Tabelas, cards de meta, Sheets
│   │   └── _lib/{actions,service,schema,loader}.ts
│   └── visao-geral/
│       └── _components/DashboardCards.tsx   # EDITAR: cartão "Planejado"/"Folga" puxa total real (hoje "--")
prisma/
├── schema.prisma                       # + PlanItem, FixedAccount, AnnualExpense, Goal (+ WeeklySpend se tabela dedicada)
├── migrations/                         # nova migration via DIRECT_URL (5432)
└── seed.ts                             # (metas via service no 1º acesso — ver D-06; seed.ts só se preferir)
```

### Pattern 1: Server Action fina (padrão canônico do repo)
**What:** Action faz 4 coisas: parse Zod, pega userId da sessão, chama service, revalida. Zero lógica de negócio.
**When to use:** toda mutação (criar/editar/excluir item, conta fixa, gasto anual, meta; salvar "Gastei").
**Example:**
```typescript
// Source: src/app/(authed)/lancamentos/_lib/actions.ts (padrão já no repo)
'use server'
export async function createPlanItemAction(_prev: unknown, data: PlanItemFormData) {
  const parsed = planItemSchema.safeParse(data)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  try {
    const userId = await getUserId()          // SEMPRE da sessão, NUNCA do form (regra de segurança)
    await createPlanItemService({ ...parsed.data, userId })
    revalidatePath('/planejamento')
    revalidatePath('/visao-geral')            // cartão "Planejado" depende do total
    return { success: true }
  } catch {
    return { success: false, error: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' }
  }
}
```

### Pattern 2: `getOrCreate*` idempotente para pré-preenchimento (D-04) e seed de metas (D-06)
**What:** No primeiro acesso ao recurso, cria o estado inicial; depois sempre retorna o existente. Mesmo padrão de `getOrCreateMonthlyBudget`.
**When to use:** pré-preencher o 1º mês com a rotina do spec; semear as 2 metas sem valores.
**Example:**
```typescript
// Source: src/app/(authed)/visao-geral/_lib/service.ts getOrCreateMonthlyBudget (padrão no repo)
export async function getOrCreatePlan(userId: string, month: string) {
  const existing = await prisma.planItem.findMany({ where: { userId, month } })
  if (existing.length > 0) return existing

  // Há plano em algum mês anterior? Então este mês começa VAZIO (usuário usa "Copiar plano") — D-04
  const anyPrior = await prisma.planItem.findFirst({ where: { userId, month: { lt: month } } })
  if (anyPrior) return []

  // Primeiro mês sem histórico → pré-preenche a rotina do spec (D-04)
  return prisma.$transaction(SPEC_ROUTINE_ITEMS.map((i) =>
    prisma.planItem.create({ data: { ...i, userId, month } })
  ))
}
```
> **Nota D-04:** itens do plano exigem ação explícita para copiar entre meses (diferente do teto, que auto-copia). "Copiar plano do mês anterior" (PLAN-05) é uma Server Action que lê os `PlanItem` do mês anterior e os recria no mês atual.

### Pattern 3: Contas fixas como linhas DERIVADAS no plano (D-05, PLAN-06)
**What:** As contas fixas **não** viram `PlanItem` persistidos. O service do plano lê `FixedAccount` e as projeta como linhas somente-leitura do grupo "Contas fixas" em tempo de render.
**When to use:** ao montar a tabela do plano e o total planejado.
**Why:** persistir duplicaria dados — editar a conta fixa teria que propagar para N meses. Derivar mantém uma única fonte de verdade e casa com a UI (ícone `Lock`, "edite na seção Contas fixas").
```typescript
// service do plano combina itens persistidos + contas fixas derivadas
const planRows = [...persistedItems, ...fixedAccountsAsRows(fixedAccounts)]
const totalPlanejado = planRows.reduce((s, r) => s + r.valorPorVez * r.nSemanas, 0)
```

### Pattern 4: Faixa de semana compartilhada (extrair de `getWeeklySpending`)
**What:** A lógica `day<=7 →Sem1 … else →Sem4` já existe em `visao-geral/_lib/service.ts`. Extrair para `src/lib/weeks.ts` para o "Gastei" automático (D-02) reutilizar exatamente a mesma faixa que o gráfico semanal.
**Why:** garante que o cartão semanal e o gráfico do dashboard concordem sobre em qual semana uma transação cai.
```typescript
// src/lib/weeks.ts (NOVO)
export function weekIndexForDay(day: number): 0 | 1 | 2 | 3 {
  if (day <= 7) return 0
  if (day <= 14) return 1
  if (day <= 21) return 2
  return 3  // 22 até o fim do mês (spec §Cálculos)
}
export function weekDateRange(month: string, weekIndex: 0|1|2|3): { start: Date; end: Date } {
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()          // getDaysInMonth equivalente
  const startDay = weekIndex * 7 + 1
  const endDay = weekIndex === 3 ? lastDay : startDay + 6
  return { start: new Date(y, m - 1, startDay), end: new Date(y, m - 1, endDay) }
}
```

### Anti-Patterns to Avoid
- **Persistir contas fixas como itens do plano:** gera dessincronia; derive em tempo de render (D-05).
- **Calcular "Gastei" ou total no cliente:** a lógica financeira vive no `service.ts` testável; o cliente só exibe.
- **Formatar moeda inline (`toFixed`, `Intl` solto):** use `formatBRL()`. Formatar data com `toLocaleDateString()`: use `formatDate()`. (Regra travada na Fase 1 — evita bug de hydration/timezone.)
- **Float para dinheiro:** tudo `Int` em centavos. `valorAno / 12` e `(meta−guardado)/meses` produzem **frações de centavo** — ver Pitfall 1 (arredondamento).
- **Duplicar a lógica de faixa de semana:** reaproveite `src/lib/weeks.ts`; não reimplemente nos cartões.
- **Esquecer `revalidatePath('/visao-geral')`** ao mudar itens do plano: o cartão "Planejado"/"Folga" do dashboard depende do total.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dias no mês / fim do mês (semana 4 = 22–fim) | Loop manual de dias / lógica de ano bissexto | `date-fns` `getDaysInMonth` / `lastDayOfMonth` | Fevereiro, bissexto e meses de 30/31 são erro clássico |
| Meses até o prazo (guardar/mês da meta) | Subtração manual de ano×12+mês | `date-fns` `differenceInCalendarMonths` | Lida com viradas de ano corretamente |
| Checar se transação cai na faixa da semana | Comparação manual de timestamps | `date-fns` `isWithinInterval` ou comparação de `getDate()` (já no repo) | Timezone-safe se usar `getDate()` de uma `@db.Date` |
| Formatação R$ / data | `toFixed(2)` + concat | `formatBRL()` / `formatDate()` (já no repo) | Única fonte; evita hydration mismatch |
| Checkbox / Switch / barra de progresso acessíveis | `<input type=checkbox>` estilizado na mão | shadcn `Checkbox`/`Switch`/`Progress` (Radix) | `role`, `aria-checked`, foco e teclado prontos |
| Tabela com `<th scope>` e semântica | `<div>` grid | shadcn `Table` | a11y exigida pelo UI-SPEC de graça |

**Key insight:** o risco desta fase não é de biblioteca — é de **aritmética de centavos e de calendário**. date-fns cobre o calendário; a aritmética de centavos precisa de **testes** (ver Validation Architecture), não de biblioteca.

## Common Pitfalls

### Pitfall 1: Arredondamento de centavos em divisões (÷12 e /meses)
**What goes wrong:** `valorAno / 12` e `(meta − guardado) / mesesAtéPrazo` quase nunca dão inteiro de centavos. Dividir `Int` e exibir sem política de arredondamento causa "R$ 83,333..." ou soma dos 12 meses ≠ valor anual.
**Why it happens:** dinheiro é `Int` centavos, mas a divisão é real.
**How to avoid:** decidir e documentar a política: `Math.round(valorAnoCents / 12)` para exibição de "por mês" (é só exibição — D-05 não persiste). Para metas idem. **Não** tentar fazer os 12 meses somarem exatamente o anual (não é requisito). Cobrir com teste: entrada 100000 (R$1.000/ano) → 8333 cents (R$83,33).
**Warning signs:** valores com mais de 2 casas; "por mês" × 12 ≠ anual (aceitável, mas documente).

### Pitfall 2: `nº de semanas = 0` (item sem nenhuma semana marcada)
**What goes wrong:** total do item = valor × 0 = 0, ou divisão por semanas em algum cálculo.
**Why it happens:** D-01 define "nº de vezes = quantidade de semanas marcadas"; usuário pode desmarcar todas.
**How to avoid:** Zod valida "Marque pelo menos uma semana." (texto já no UI-SPEC). Teste: item com 0 semanas é rejeitado.
**Warning signs:** item que não aparece em nenhum cartão semanal mas conta/não conta no total.

### Pitfall 3: `prazo` da meta no passado ou ausente → divisão por 0/negativa
**What goes wrong:** `(meta − guardado) / mesesAtéPrazo` com meses ≤ 0 → Infinity/NaN/negativo.
**Why it happens:** metas seed (D-06) nascem **sem prazo**; usuário pode pôr prazo já vencido.
**How to avoid:** se meses ≤ 0 ou prazo ausente, exibir placeholder `[mês/ano]` e **não** calcular "guardar por mês" (UI-SPEC já prevê placeholders). Teste: prazo nulo → não calcula; prazo passado → trata como 0 meses (exibe o restante total ou placeholder, decidir).
**Warning signs:** "Guardar R$ Infinity por mês".

### Pitfall 4: Override manual do "Gastei" vs. recálculo automático (D-02)
**What goes wrong:** salvar o valor automático como override congela o número; transações novas depois não atualizam. Ou: não distinguir "0 digitado" de "sem override".
**Why it happens:** override é **opcional**; exibição = override se existir, senão soma automática.
**How to avoid:** persistir override como **nullable** (`manualCents Int?`). `null` = usa automático; valor (incl. 0) = override. "Recalcular" seta `null`. Teste: null→soma automática; 0→exibe R$0,00 (override); valor→exibe valor.
**Warning signs:** "Gastei" não reage a novas transações quando deveria, ou reage quando foi fixado à mão.

### Pitfall 5: `month` como `YYYY-MM` — escopo e ordenação
**What goes wrong:** comparar meses como número, ou misturar `Date` com `String`. Faixa de datas de transação precisa de `Date` com hora.
**Why it happens:** `MonthlyBudget.month` é `String 'YYYY-MM'`; `Transaction.date` é `@db.Date`.
**How to avoid:** manter o padrão do repo: `month: String` nos novos modelos; `@@unique([userId, month])` onde fizer sentido (plano por mês). Para somar transações, construir `start`/`end` como em `getTotalSpent` (`new Date(y, m-1, 1)` … `new Date(y, m, 0, 23,59,59,999)`). Ordenação lexicográfica de `'YYYY-MM'` funciona (`month: { lt: month }`).
**Warning signs:** plano de um mês vazando para outro; "copiar do mês anterior" pegando o mês errado.

## Code Examples

### Novos modelos Prisma (recomendação — Claude's Discretion sobre nomes/campos)
```prisma
// Source: derivado de prisma/schema.prisma (padrões MonthlyBudget/Category do repo)

model PlanItem {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  month        String                              // 'YYYY-MM' — igual a MonthlyBudget
  name         String
  category     Category @relation(fields: [categoryId], references: [id])   // grupo = categoria da Casa (D-03)
  categoryId   String
  valuePerCents Int                                 // valor por vez, em centavos
  week1        Boolean  @default(false)             // D-01: 4 semanas explícitas
  week2        Boolean  @default(false)
  week3        Boolean  @default(false)
  week4        Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([userId, month])
}

model WeeklySpend {                                 // override manual do "Gastei" (D-02) — tabela dedicada
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  month       String
  weekIndex   Int                                   // 0..3
  categoryId  String                                // mesma categoria do item
  manualCents Int                                   // valor digitado (null row ausente = usa automático)
  @@unique([userId, month, weekIndex, categoryId])
}

model FixedAccount {                                // FIXA-01
  id           String  @id @default(cuid())
  userId       String
  user         User    @relation(fields: [userId], references: [id])
  name         String
  dueDay       Int                                  // 1..31
  amountCents  Int
  autoDebit    Boolean @default(false)
  createdAt    DateTime @default(now())
}

model AnnualExpense {                               // FIXA-02
  id            String  @id @default(cuid())
  userId        String
  user          User    @relation(fields: [userId], references: [id])
  name          String
  yearlyCents   Int
  dueMonth      Int                                 // 1..12
  createdAt     DateTime @default(now())
}

model Goal {                                        // META-01
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String
  targetCents Int      @default(0)                  // seed nasce zerado (D-06)
  savedCents  Int      @default(0)
  deadline    String?                               // 'YYYY-MM' nullable (seed sem prazo)
  createdAt   DateTime @default(now())
}
```
> **Decisão (Claude's Discretion):** `WeeklySpend` como tabela dedicada é mais limpo que campos no `PlanItem` porque o "Gastei" é **por semana × categoria**, não por item (vários itens podem compartilhar categoria na mesma semana). Alternativa aceitável: `manualCents Int?` em uma linha semana×categoria. O planner decide; ambos são válidos.
> **Lembrar:** adicionar as relações inversas em `model User` (`planItems PlanItem[]`, `fixedAccounts FixedAccount[]`, etc.) senão a migration falha.

### Cálculo do resumo do plano (service puro, testável)
```typescript
// Source: regras do spec.md §Cálculos
export function computePlanSummary(rows: PlanRow[], ceilingCents: number) {
  const totalPlanejado = rows.reduce(
    (sum, r) => sum + r.valuePerCents * countWeeks(r),   // total item = valor × nº semanas (D-01)
    0,
  )
  const folga = ceilingCents - totalPlanejado            // spec: folga = teto − planejado
  return { totalPlanejado, folga, acima: folga < 0 }     // folga<0 → "Passou do teto em R$ X"
}
const countWeeks = (r: PlanRow) => [r.week1, r.week2, r.week3, r.week4].filter(Boolean).length
```

### "Gastei" automático da semana (soma de Transactions na faixa)
```typescript
// Source: padrão getTotalSpent + getWeeklySpending de visao-geral/_lib/service.ts
import { weekDateRange } from '@/lib/weeks'
export async function getAutoGastei(userId: string, month: string, weekIndex: 0|1|2|3, categoryId: string) {
  const { start, end } = weekDateRange(month, weekIndex)
  const r = await prisma.transaction.aggregate({
    _sum: { amountCents: true },
    where: { userId, account: 'CASA', type: 'SAIDA', categoryId,
             date: { gte: start, lte: end } },
  })
  return r._sum.amountCents ?? 0
}
// exibição: manualCents ?? autoGastei  (D-02 — override tem precedência)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CLAUDE.md diz "recharts 2.x" | **recharts 3.11.1 instalado** no projeto | Fase 2 | Já funcionando no gráfico semanal; **não** alterar. O doc está desatualizado, o código é a verdade. Flag para atualizar CLAUDE.md eventualmente |
| `MonthlyBudget` com cartão "Planejado" mostrando `--` | Fase 3 liga o total planejado real | esta fase | `DashboardCards.tsx` cartões 2 e 3 passam a usar dados reais |
| Telas `/planejamento` e `/contas-fixas` como stub "em breve" | Server Components completos | esta fase | Substituem os stubs |

**Deprecated/outdated:**
- CLAUDE.md §Stack cita recharts 2.x e date-fns v3 — date-fns bate (3.6.0), recharts **não** (3.11.1). Confiar no `package.json`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `WeeklySpend` como tabela dedicada (vs. campo no PlanItem) para o override do "Gastei" | Code Examples / Pitfall 4 | Baixo — ambos funcionam; refator de schema se o planner preferir o outro. D-02 só exige "persistir override opcional" |
| A2 | Política de arredondamento = `Math.round` para "por mês" (÷12 e /meses), sem forçar soma exata | Pitfall 1 | Médio — se o usuário esperar que 12×(valor/12) = anual exato, haverá ±centavos. Confirmar com usuário é opcional (é só exibição) |
| A3 | Prazo de meta no passado/0 meses → exibe restante total ou placeholder (não calcula "por mês") | Pitfall 3 | Baixo — UI-SPEC já prevê placeholder `[mês/ano]`; comportamento exato quando prazo = mês atual pode variar |
| A4 | Seed das 2 metas via service `getOrCreate` no 1º acesso (não via `prisma/seed.ts`) | Architecture Pattern 2 | Baixo — `seed.ts` existe e roda no deploy; metas poderiam ir lá. Mas service no 1º acesso cobre usuários futuros sem re-seed. Planner decide |
| A5 | "Copiar plano do mês anterior" copia apenas `PlanItem` persistidos (não as contas fixas derivadas) | Pattern 3 | Baixo — contas fixas já entram sozinhas em todo mês; copiá-las duplicaria |

## Open Questions (RESOLVED)

1. **Override do "Gastei" por semana×categoria ou por item?**
   - What we know: D-02 diz "persistir override manual (valor opcional)"; UI-SPEC mostra o campo por item dentro do cartão da semana.
   - What's unclear: se dois itens da mesma categoria caem na mesma semana, o "Gastei" automático (soma de Transactions por categoria) é por categoria, não por item — mas o campo é exibido por item.
   - RESOLVED: `WeeklySpend` com chave `(userId, month, weekIndex, categoryId)`; o editor de "Gastei" é renderizado no nível da categoria dentro da semana (não duplicado por item). Resolvido no Plano 03.

2. **Arredondamento "guardar por mês" — confirmar com usuário?**
   - What we know: é só exibição (D-05: anual não vira meta).
   - What's unclear: expectativa do usuário sobre ±centavos.
   - RESOLVED: `Math.round` para exibição (ASSUMED de baixo risco, documentado).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/runtime | ✓ | v22.23.0 | — |
| npm | instalar peers Radix | ✓ | 10.9.8 | — |
| Prisma CLI | migration dos novos modelos (DIRECT_URL 5432) | ✓ | 6.19.3 | — |
| Supabase Postgres | persistência | ✓ (remoto) | managed | — |
| shadcn CLI (`npx shadcn@latest`) | copiar checkbox/switch/progress/table | ✓ (via npx) | latest | adicionar peers manualmente + colar componentes |
| date-fns | cálculo de calendário | ✓ | 3.6.0 | — |

**Missing dependencies with no fallback:** nenhuma.
**Missing dependencies with fallback:** nenhuma crítica.

> **Nota:** migrations devem usar `DIRECT_URL` (porta 5432) — `npx prisma migrate dev` contra o pooler 6543 trava (regra travada no CLAUDE.md). O `seed.ts` já normaliza para DIRECT_URL.

## Validation Architecture

> `workflow.nyquist_validation` = `true` em `.planning/config.json`. Seção obrigatória.
> **Esta fase é aritmética-pesada e sem infraestrutura de teste existente** — a maior parte do valor de validação está em testes unitários/property das funções puras de cálculo. Wave 0 precisa instalar o framework.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | **Vitest** (recomendado — zero-config com TS/ESM, compatível com Next 15/Vite; nenhum framework presente hoje) `[ASSUMED]` |
| Config file | **none — Wave 0 cria** `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/weeks.test.ts` (ou arquivo-alvo) |
| Full suite command | `npx vitest run` |

> **Por que Vitest e não Jest:** o projeto é ESM + TS + Next 15; Vitest roda `*.service.ts`/`*.ts` puros sem config de Babel/ts-jest. A lógica a testar é **TypeScript puro** (services e `weeks.ts`), não componentes React — nenhum DOM necessário. `[ASSUMED]` — não verificado contra registry nesta sessão; planner deve rodar a Package Legitimacy Gate (`vitest`, `@vitest/*`) em Wave 0 antes de instalar.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAN-02 | total item = valor × nº semanas marcadas; % do teto | unit | `npx vitest run src/app/(authed)/planejamento/_lib/service.test.ts` | ❌ Wave 0 |
| PLAN-02 | 0 semanas marcadas é rejeitado (Zod) | unit | idem (schema test) | ❌ Wave 0 |
| PLAN-03 | folga = teto − planejado; folga<0 → flag "passou" | unit | idem | ❌ Wave 0 |
| PLAN-04 | faixa de semana 1-7/8-14/15-21/22-fim; fev/30/31 dias (property) | unit | `npx vitest run src/lib/weeks.test.ts` | ❌ Wave 0 |
| PLAN-04 | "Gastei" automático = Σ Transaction CASA na faixa; override tem precedência | integration | `npx vitest run .../service.test.ts` (mock Prisma) | ❌ Wave 0 |
| PLAN-05 | copiar plano do mês anterior recria os PlanItem | integration | idem | ❌ Wave 0 |
| PLAN-06 | conta fixa aparece como linha derivada no grupo "Contas fixas" | unit | `fixedAccountsAsRows()` test | ❌ Wave 0 |
| FIXA-02 | guardar/mês = valorAno ÷ 12 (arredondamento) | unit | `npx vitest run .../contas-fixas/_lib/service.test.ts` | ❌ Wave 0 |
| META-01 | guardar/mês = (meta−guardado)/meses; prazo nulo/passado não calcula; progresso = guardado/alvo | unit | idem | ❌ Wave 0 |
| META-02 | seed cria "Reserva de emergência" e "Caixinha do carro" sem valores | integration | idem | ❌ Wave 0 |
| PLAN-01 | teto padrão R$ 3.000 quando sem MonthlyBudget | unit | reaproveita getOrCreateMonthlyBudget (Fase 2) | existe (Fase 2) |

### Sampling Rate
- **Per task commit:** `npx vitest run <arquivo-alvo da task>` (ex.: `src/lib/weeks.test.ts`) — deve passar antes do commit da task.
- **Per wave merge:** `npx vitest run` (suíte completa) + `npx tsc --noEmit` (padrão do projeto, verde na Fase 2).
- **Phase gate:** `npx vitest run` todo verde + `npm run build` (prisma generate + next build) antes de `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] Framework install: `npm i -D vitest` (+ rodar Package Legitimacy Gate em `vitest` antes) — nenhum framework de teste existe hoje `[VERIFIED: find não achou *.test.ts/*.spec.ts nem vitest/jest config]`
- [ ] `vitest.config.ts` — config mínima (environment node; a lógica testada é TS puro, sem DOM)
- [ ] `src/lib/weeks.test.ts` — property/edge: fevereiro (28/29), meses de 30 e 31 dias, dias de borda (7,8,14,15,21,22,último), cobre PLAN-04
- [ ] `src/app/(authed)/planejamento/_lib/service.test.ts` — total/folga/%/0-semanas/override; cobre PLAN-02/03/04/05
- [ ] `src/app/(authed)/contas-fixas/_lib/service.test.ts` — ÷12, guardar/mês, prazo nulo/passado, seed; cobre FIXA-02/META-01/META-02
- [ ] Decidir mock de Prisma para testes de service com DB (ex.: injeção de client ou `vitest-mock-extended`) — ou manter services de cálculo **puros** (sem Prisma) recebendo dados já carregados, o que dispensa mock e é a recomendação (ver Pattern: `computePlanSummary(rows, ceiling)` não toca Prisma).

> **Recomendação forte:** separar **funções de cálculo puras** (recebem números/arrays, retornam números — testáveis sem DB) das **funções de acesso a dados** (Prisma). As puras (`computePlanSummary`, `countWeeks`, `weekIndexForDay`, `weekDateRange`, `computeGoalMonthly`, `computeAnnualMonthly`) carregam todo o risco de correção e são triviais de testar sem mock. Isso maximiza cobertura de validação com custo mínimo de infraestrutura.

## Security Domain

> `security_enforcement` = `true`, ASVS level 1. Fase é CRUD autenticado sobre dados do próprio usuário.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth via `@supabase/ssr` (já na Fase 1); `middleware.ts` protege as rotas |
| V3 Session Management | yes | `userId` sempre de `supabase.auth.getUser()` na Server Action — NUNCA do form (regra T-02-04 já no repo) |
| V4 Access Control | yes | Toda query Prisma filtra por `userId` da sessão; novos modelos escopados por `userId`. Garantir que editar/excluir item/conta/meta valide ownership (ex.: `where: { id, userId }`) |
| V5 Input Validation | yes | Zod em toda Server Action (dia 1–31, valor > 0, ≥1 semana, nome obrigatório — textos no UI-SPEC) |
| V6 Cryptography | no | Sem dados sensíveis novos; sem cripto própria |

### Known Threat Patterns for Next.js 15 / Prisma / Supabase
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR — editar/excluir item/meta de outro usuário por ID | Elevation of Privilege | `where: { id, userId }` em update/delete; nunca confiar em ID isolado |
| SQL injection | Tampering | Prisma parametriza; não usar `$queryRawUnsafe` |
| Mass assignment via form (ex.: `userId` no body) | Tampering | `userId` da sessão, não do input; Zod schema sem `userId` |
| XSS em nomes de item/meta digitados | Tampering | React escapa por padrão; não usar `dangerouslySetInnerHTML` |
| Broken access control em Server Action | Elevation of Privilege | `getUserId()` no início de toda action (padrão do repo) |

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma`, `src/lib/prisma.ts`, `src/lib/format.ts`, `src/store/conta.ts` — modelos, singleton, formatadores, store (código do repo, verdade canônica)
- `src/app/(authed)/visao-geral/_lib/{service,loader}.ts` — `getOrCreateMonthlyBudget`, `getWeeklySpending` (faixa de semana), `getTotalSpent` (padrão de faixa de data), `Promise.all` loader
- `src/app/(authed)/lancamentos/_lib/{actions,schema}.ts` — padrão Server Action fina + Zod + `getUserId` da sessão
- `src/app/(authed)/visao-geral/_components/DashboardCards.tsx` — ponto de integração do cartão "Planejado"/"Folga"
- `package.json` + `npm ls date-fns` — versões instaladas verificadas
- `ui.shadcn.com` registry — nomes e deps de `checkbox`/`switch`/`progress`/`table` verificados via curl
- `npm view` + `gsd-tools package-legitimacy` — 3 peers Radix verdict OK
- `spec.md §Regras de cálculo` + `03-CONTEXT.md` (D-01..D-06) + `03-UI-SPEC.md` — regras de negócio e contrato visual

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — decisões acumuladas (Int centavos, DATE+date-fns, singleton Prisma)

### Tertiary (LOW confidence)
- Vitest como escolha de framework de teste — `[ASSUMED]`, não verificado contra registry nesta sessão (providers de busca desabilitados no config); planner valida em Wave 0.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — toda a stack já instalada e provada em código; 4 shadcn + 3 Radix verificados em registry/legitimacy
- Architecture: HIGH — padrões (Server Action fina, service puro, getOrCreate, colocation) extraídos diretamente do código das Fases 1–2
- Pitfalls: HIGH — derivados das regras de cálculo do spec e do shape real dos dados; cada um com teste associado
- Validation: MEDIUM — framework de teste é ASSUMED (Vitest), inexistente hoje; a estratégia (funções puras testáveis) é HIGH

**Research date:** 25/11/2026
**Valid until:** 25/12/2026 (stack estável; revalidar versões Radix/date-fns em 30 dias)
