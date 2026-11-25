# Phase 4: Empresas (multi) e Renda Familiar — Context

**Gathered:** 2026-11-25
**Status:** Ready for planning
**Rodada:** Fatia 1 de 4 — **Fundação multi-empresa** (as fatias P&L, pró-labore→renda familiar e consolidado+projeção terão suas próprias rodadas de discussão)

<domain>
## Phase Boundary

Esta rodada entrega **somente a fundação** do bloco multi-empresa:

1. **Entidade Empresa** no modelo de dados, substituindo o lado "EMPRESA" do enum `ContaType`. A Casa continua um conceito próprio e separado.
2. **CRUD de empresas** (criar, editar, remover).
3. **Seletor dropdown no topo** "Casa + empresas", trocando o contexto ativo de todas as telas.
4. **Categorias de receita/custo por empresa**, semeadas com um padrão inicial.
5. Os **lançamentos** e a **visão geral** passam a funcionar **por empresa selecionada** (reaproveita o CRUD de lançamentos da Fase 2, agora apontando para a empresa ativa em vez do enum EMPRESA).

**Fora desta fatia (rodadas seguintes, já no design aprovado):** P&L por empresa (faturamento bruto/líquido, lucro, módulos por tipo como comissões/anúncios/ROAS, recorrência+projetos), pró-labore multi-origem → renda familiar, consolidado das empresas, projeção de caixa, dívidas e impostos/DAS por empresa, e toda a cauda de multiusuário/orçamento por pessoa.
</domain>

<decisions>
## Implementation Decisions

### Escopo
- **D-01:** Fatia de fundação conforme o Phase Boundary acima. Entregar a base utilizável (criar empresa, selecioná-la, lançar nela) sem os cálculos de P&L nem as telas de pró-labore/consolidado/projeção/dívidas.

### Tipos de empresa
- **D-02:** Tipos **fixos pré-definidos**: **Afiliado**, **Jurídico/Serviços**, **Infoproduto**, **Genérico**. Cada empresa escolhe um no cadastro. Nesta fatia o tipo é um campo armazenado que também determina o conjunto de categorias padrão (D-04); os módulos específicos por tipo (ROAS/anúncios para Afiliado, recorrência+projetos para Jurídico) entram nas fatias de P&L.

### Cadastro da empresa
- **D-03:** Campos ao criar: **nome**, **tipo**, **cor** (para diferenciar no seletor, como o azul da Casa). CNPJ opcional/adiado. CRUD completo. Remover empresa deve seguir o padrão de proteção das categorias (D-08 da Fase 2): bloquear/alertar se houver lançamentos vinculados (detalhe no planejamento).

### Categorias por empresa
- **D-04:** Cada empresa tem **suas próprias** categorias de receita e custo (não compartilhadas), semeadas com um **conjunto padrão** ao criar — custos típicos: imposto, funcionário, ferramentas, anúncios, investimento; receitas conforme o tipo. Editáveis por empresa.

### Seed de empresas
- **D-05:** Começa com **3 empresas pré-cadastradas**: **Elite Juris** (Jurídico/Serviços), **Achadinhos** (Afiliado), **Infoproduto** (Infoproduto) — cada uma com suas categorias padrão. (Mesmo padrão do seed de metas da Fase 3: via seed re-executável / getOrSeed.)

### Seletor / navegação
- **D-06:** **Dropdown no topo**: "Casa | Elite Juris | Achadinhos | Infoproduto", cada item com sua cor. Substitui o toggle Casa/Empresa atual. O store Zustand `contaAtiva` deixa de ser o enum `CASA | EMPRESA` e passa a representar **Casa ou uma empresa específica** (ex.: `{ tipo: 'CASA' } | { tipo: 'EMPRESA', empresaId }`). Todas as telas filtram pelo contexto ativo.

### Migração de dados
- **D-07:** Lado Empresa **vazio** (confirmado pelo Thaylan) → **recomeço limpo**, com **backup antes** (regra do CLAUDE.md). Dados da Casa (Fases 2/3) **preservados**. `Transaction` e `Category` passam a referenciar a empresa (ex.: `empresaId` nullable, `null` = Casa) em vez do valor `EMPRESA` do enum. Forma exata do schema fica para pesquisa/planejamento.

### Claude's Discretion
- Forma exata do schema: modelo `Empresa` (nome, tipo, cor, userId); como `Transaction`/`Category` representam Casa vs empresa (`empresaId` nullable vs tabela de contas); o que acontece com o enum `ContaType`.
- Representação do contexto ativo no store (`contaAtiva` → Casa | empresaId) e como o `mesSelecionado` se combina.
- Proteção ao remover empresa (seguir D-08 da Fase 2).
- Layout do dropdown e das telas de CRUD de empresa (seguir os padrões de UI existentes; gerar UI-SPEC se necessário).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design e Regras
- `docs/superpowers/specs/2026-11-25-multi-empresa-renda-familiar-design.md` — **Design autoritativo** do bloco multi-empresa (fluxo, objetivos, decisões de arquitetura, reorganização do roadmap). Leitura obrigatória.
- `spec.md` §"Evolução: Multi-Empresa e Renda Familiar" — tem precedência sobre as telas 5/6 e a tabela de entidades.

### Requisitos e Roadmap
- `.planning/ROADMAP.md` §"Phase 4: Empresas (multi) e Renda Familiar" — objetivo, critérios e a divisão em fatias (4a–4d).
- `.planning/REQUIREMENTS.md` — CHAN-*/DIV-*/DASH-03/04 reinterpretados; novos EMP-*/FAM-* a formalizar.
- `.planning/PROJECT.md` — decisões arquiteturais, design tokens, convenções.

### Fases anteriores (padrões a reaproveitar)
- `.planning/phases/02-core-crud/02-CONTEXT.md` — CRUD de lançamentos, categorias (D-07/D-08 proteção na exclusão), pró-labore com `pairId`.
- `.planning/phases/03-planning/03-CONTEXT.md` — padrão de seed (getOrSeed), Server Actions, store.

### Stack
- `.claude/CLAUDE.md` §Technology Stack e §Critical Configuration (DATABASE_URL 6543/pgbouncer, DIRECT_URL 5432 para migrations).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/store/conta.ts`: `useContaStore` com `contaAtiva` (hoje `'CASA' | 'EMPRESA'`) e `mesSelecionado` — será generalizado para Casa | empresa.
- `prisma/schema.prisma`: `enum ContaType { CASA EMPRESA }`; `Category.account` e `Transaction.account` usam esse enum (@@unique inclui account) — ponto central da migração.
- Seletor de conta atual (ex.: `AccountSelector` na visão geral) — vira o dropdown multi-empresa.
- CRUD de lançamentos da Fase 2 (`lancamentos/_lib` + `_components`) — reaproveitado para lançar na empresa ativa.
- Padrão de seed re-executável (seed de categorias/metas) para as 3 empresas.
- `src/lib/format.ts`, `src/lib/prisma.ts`, componentes shadcn.

### Integration Points
- A migração do enum `ContaType` toca `Category` e `Transaction` (e os @@unique) — maior ponto de atenção.
- Toda tela que filtra por `contaAtiva` precisa passar a entender "qual empresa".
</code_context>

<deferred>
## Deferred Ideas

Dentro do bloco multi-empresa, ficam para as **fatias seguintes** (não nesta rodada):
- **P&L por empresa** — faturamento bruto/líquido, lucro, e módulos específicos por tipo (comissões/anúncios/ROAS para Afiliado; recorrência+projetos para Jurídico; vendas/plataforma para Infoproduto).
- **Pró-labore multi-origem → renda familiar** — transferência de cada empresa marcando origem + visão geral da família (renda − gastos + caixa + caixinhas).
- **Consolidado das empresas** e **projeção** de caixa (3–6 meses) com alerta de saldo negativo.
- **Dívidas** (Pronampe, Simples parcelado) e **impostos/DAS** por empresa.

Decisões de produto adiadas (travar quando a fatia correspondente for discutida): regime tributário por empresa; qual empresa é dona de cada dívida; mecânica de "aplicar" o pró-labore (fixo/%/manual); conteúdo exato da tela de renda familiar e do consolidado.

Cauda do roadmap: **multiusuário** (logins separados) e **orçamento individual por pessoa** (Thaylan × Ligiane).
</deferred>

---

*Phase: 4-Empresas-multi-e-renda-familiar (Fatia 1 — Fundação)*
*Context gathered: 2026-11-25*
