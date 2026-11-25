# Phase 3: Planning - Context

**Gathered:** 2026-11-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Fase 3 entrega o **planejamento mensal da Casa**: os itens do plano do mês (grupo, valor por vez, repetições por semana), o resumo do plano (total planejado, folga, barra por grupo), os 4 cartões semanais com "Gastei R$", as contas fixas que entram automaticamente no plano, os gastos anuais ÷12, e as metas de poupança com barra de progresso. O teto do mês (`MonthlyBudget`) já existe da Fase 2 — aqui ele passa a ser comparado com o total planejado real.

Entregáveis obrigatórios (requisitos): PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, FIXA-01, FIXA-02, META-01, META-02.

**Fora do escopo desta fase (vide Deferred Ideas):** controle por pessoa / família multiusuário, múltiplas empresas, metas da Empresa, projeção de caixa (Empresa é Fase 4), dashboard/telas da Empresa.
</domain>

<decisions>
## Implementation Decisions

### Itens do plano × semanas
- **D-01:** Cada item do plano marca **explicitamente** em quais das 4 semanas ele cai (ex.: mercado nas semanas 2, 3 e 4). O "número de vezes" = quantidade de semanas marcadas. "Valor por vez" é o valor de cada ocorrência; **total do item = valor por vez × nº de semanas marcadas**. Semanas fixas do mês: semana 1 = dias 1–7, 2 = 8–14, 3 = 15–21, 4 = 22 até o fim do mês (spec §Cálculos).

### "Gastei R$" dos cartões semanais
- **D-02:** O "Gastei R$" de cada semana é **preenchido automaticamente** pela soma dos lançamentos reais (`Transaction` da Casa, mesma categoria, com `date` dentro da faixa daquela semana no mês selecionado), **com opção de sobrescrever manualmente**. Persistir o override manual (valor opcional); exibição = override manual, se houver, senão a soma automática. Restante = planejado − gastei.

### Grupo do item = Categoria existente
- **D-03:** O "grupo" de cada item do plano **reaproveita as Categorias da Casa existentes** (Alimentação, Combustível, Lazer, Contas fixas, Outros) — não cria um conceito separado de grupo. Isso garante o casamento com os lançamentos reais no cálculo automático do "Gastei" (D-02). O resumo por grupo (PLAN-03) agrega os itens por categoria.

### Plano inicial e cópia entre meses
- **D-04:** O **primeiro mês** (sem plano e sem histórico anterior) vem **pré-preenchido** com a rotina do spec: Compra do mês R$ 1.000 ×1 (semana 1), Mercado R$ 250 ×3 (semanas 2–4), Combustível R$ 100 ×4, Lazer R$ 150 ×4, Outros R$ 0. Meses seguintes começam **vazios**; o usuário traz o plano anterior pelo botão **"Copiar plano do mês anterior"** (PLAN-05). Diferente do teto (`MonthlyBudget`, que auto-copia do mês anterior — D-04 da Fase 2), os itens do plano exigem ação explícita.

### Contas fixas e gastos anuais
- **D-05:** **Conta fixa** (`FixedAccount`: nome, dia de vencimento, valor, flag de débito automático) entra **automaticamente** no plano do mês no grupo "Contas fixas", sem redigitar (PLAN-06). **Gasto anual** (`AnnualExpense`: nome, valor no ano, mês de vencimento) e **Meta** são **entidades separadas** (decisão do usuário). O gasto anual apenas **exibe** "guardar por mês" = valor no ano ÷ 12; não vira meta automaticamente.

### Metas de poupança
- **D-06:** **Meta** (`Goal`: nome, valor da meta, valor guardado, prazo) com barra de progresso e "guardar por mês" = (meta − guardado) ÷ meses até o prazo (spec §Cálculos). Seed de duas metas (META-02): **"Reserva de emergência"** e **"Caixinha do carro"**, apenas com o **nome** — valor-alvo, guardado e prazo em branco/zerados para o usuário preencher.

### Claude's Discretion
- Estrutura exata e nomes dos novos modelos Prisma (item do plano, `FixedAccount`, `AnnualExpense`, `Goal`) e campos.
- Como persistir o override manual do "Gastei" (campo opcional no item semanal vs. tabela dedicada).
- Layout exato das telas (tabela de planejamento, 4 cartões semanais, seções de contas fixas / gastos anuais / metas) — seguir o PDF de design e um UI-SPEC desta fase, se criado.
- Como o cartão "Planejado" do dashboard da Casa passa a puxar o total planejado (soma dos itens do mês) — hoje mostra "--".
- Lógica de pré-preenchimento do primeiro mês (seed no primeiro acesso vs. no render do Server Component).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Regras de Negócio e Especificação
- `spec.md` — Fonte de verdade. Seções diretamente relevantes: §3 (Planejamento e semanas), §4 (Contas fixas, gastos do ano e metas), §Regras de cálculo e dados, §Entidades. Leitura obrigatória.
- `design/telas-duas-contas.pdf` — Design visual de referência das telas de planejamento, contas fixas e metas.

### Requisitos e Roadmap
- `.planning/REQUIREMENTS.md` — Fase 3 cobre PLAN-01..06, FIXA-01/02, META-01/02.
- `.planning/ROADMAP.md` — Fase 3 (Planning), critérios de sucesso e dependência da Fase 2.
- `.planning/PROJECT.md` — Decisões arquiteturais, design tokens, stack, convenções de colocation.

### Stack e Configuração
- `.claude/CLAUDE.md` §Technology Stack e §Critical Configuration — stack, versões, DATABASE_URL (6543, pgbouncer=true) / DIRECT_URL (5432).

### Contexto de Fases Anteriores
- `.planning/phases/02-core-crud/02-CONTEXT.md` — Decisões da Fase 2: `MonthlyBudget` (teto, D-01..D-04), padrão de edição inline, gerenciamento de categorias, pró-labore.
- `.planning/phases/02-core-crud/02-UI-SPEC.md` — Contrato visual/interação da Fase 2 (padrões de Sheet, Card, cartões do dashboard, copywriting pt-BR) a reaproveitar.
- `.planning/phases/01-foundation/01-CONTEXT.md` — Schema inicial, utilitários formatBRL/formatDate, store Zustand, seed de categorias.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/format.ts`: `formatBRL(cents)` e `formatDate(date)` — usar em toda exibição de valores/datas.
- `src/store/conta.ts`: `useContaStore` (`contaAtiva`, `mesSelecionado`) — filtrar plano/lançamentos pelo mês selecionado.
- `src/lib/prisma.ts`: singleton do PrismaClient — importar sempre daqui.
- Componentes shadcn: `Button`, `Input`, `Label`, `Card`, `Separator`, `Sheet`, `Skeleton`.
- Modelo `MonthlyBudget` (teto do mês) já existe — a Fase 3 compara o total planejado com `ceilingCents`.

### Established Patterns
- Server Actions finas: parse Zod → chama service (`*.service.ts`) → `revalidatePath`.
- Lógica de negócio em `*.service.ts` (TS puro, testável).
- Feature-per-route com colocation: `_components/`, `_lib/` (actions, service, schema, loader).
- Valores sempre em centavos (`Int`); datas como `DATE`, parse com date-fns formato explícito.

### Integration Points
- Cartão "Planejado" do dashboard da Casa (hoje "--") passa a exibir o total planejado do mês.
- Telas-stub `/planejamento` e `/contas-fixas` ("em breve") serão implementadas nesta fase.
- Cálculo automático do "Gastei" depende das `Transaction` da Casa já existentes (Fase 2).
</code_context>

<specifics>
## Specific Ideas

- Valores iniciais da rotina (spec §3) para o pré-preenchimento do primeiro mês: compra do mês R$ 1.000, mercado R$ 250 ×3, combustível R$ 100 ×4, lazer R$ 150 ×4.
- Semanas fixas do mês (1–7, 8–14, 15–21, 22–fim) — não configuráveis.
- Metas iniciais pré-cadastradas apenas por nome: "Reserva de emergência", "Caixinha do carro".
- Reserva de emergência (dor central do usuário) deve aparecer como meta com barra de % de progresso e quanto guardar por mês.
</specifics>

<deferred>
## Deferred Ideas

Ideias levantadas pelo usuário na discussão desta fase que **fogem do spec/roadmap atual** e foram adiadas (decisão: "Fase 3 só Casa + guardar o resto"). Exigem revisão dedicada do roadmap/spec antes de implementar.

- **Família multiusuário + gastos por pessoa** — controlar gastos da família + gastos individuais (Thaylan / Ligiane), com barra de "quanto ainda resta" do valor estipulado por pessoa. Hoje o app é de 1 login e a Casa é um bolso único; isso adiciona uma dimensão "pessoa/dono" aos lançamentos e, se for login separado, mexe em AUTH. → Revisar roadmap (possível novo requisito/fase).
- **Múltiplas empresas (3) com visão individual** — por empresa: quanto investir, meta, meta de custo, faturamento e destinação de valores. As 3 empresas são **Elite Juris, Infoproduto e Achadinhos** — negócios **distintos**, não os canais de afiliado do spec. Importante: "Elite Juris" é outra linha (jurídica), enquanto o spec atual modela **uma** Empresa de afiliados Shopee/Shein com canais (Dicas da Liz, Achadinhos da Mel, Infoproduto). Ou seja, o domínio Empresa precisa suportar **múltiplos negócios separados**, cada um com faturamento/metas/investimento próprios. Muda o modelo de dados da Empresa e provavelmente a estrutura das Fases 4+. → Revisão dedicada de spec/roadmap.
- **Reserva de emergência e metas para a Empresa** — metas hoje são só da Casa; levar o conceito (com barra de %) para a Empresa. → Fase 4+.
- **Projeção de "quanto vai sobrar" (pessoal/família)** — visão forward-looking do que sobra. Para a Empresa já está previsto o fluxo de caixa projetado (Fase 4); a versão pessoal/família é nova.

*Captura destas ideias não implica compromisso de escopo — serão avaliadas numa conversa dedicada de roadmap/spec.*
</deferred>

---

*Phase: 3-Planning*
*Context gathered: 2026-11-25*
