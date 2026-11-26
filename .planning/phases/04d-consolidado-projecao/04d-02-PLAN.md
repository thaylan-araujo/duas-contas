---
phase: 04d-consolidado-projecao
plan: 02
type: execute
wave: 1
depends_on:
  - 04d-01
files_modified:
  - src/app/(authed)/canais/_lib/das.ts
  - src/app/(authed)/canais/_lib/das.test.ts
  - src/app/(authed)/canais/_lib/loader.ts
  - src/app/(authed)/canais/page.tsx
  - src/app/(authed)/canais/_components/PnlCards.tsx
  - src/app/(authed)/empresas/_lib/schema.ts
  - src/app/(authed)/empresas/_lib/service.ts
  - src/app/(authed)/empresas/_lib/actions.ts
  - src/app/(authed)/empresas/_components/EmpresaSheet.tsx
autonomous: true
requirements:
  - CONS-02
user_setup: []

must_haves:
  truths:
    - "O usuário define a alíquota do DAS (%) de uma empresa na tela de editar empresa e ela persiste"
    - "O P&L da empresa (/canais) mostra o DAS estimado do mês = alíquota × faturamento bruto"
    - "Empresa sem alíquota definida mostra DAS estimado como 'não definido' (não R$ 0,00 silencioso)"
  artifacts:
    - path: "src/app/(authed)/canais/_lib/das.ts"
      provides: "Função pura computeDasEstimado (alíquota × faturamento bruto, em centavos)"
      min_lines: 10
    - path: "src/app/(authed)/canais/_lib/das.test.ts"
      provides: "Testes Vitest da função pura de DAS (casos de arredondamento, null, zero)"
      contains: "computeDasEstimado"
    - path: "src/app/(authed)/empresas/_components/EmpresaSheet.tsx"
      provides: "Campo alíquota (%) no formulário de empresa"
      contains: "aliquota"
  key_links:
    - from: "src/app/(authed)/canais/page.tsx"
      to: "src/app/(authed)/canais/_lib/das.ts"
      via: "page computa DAS estimado via computeDasEstimado e passa ao PnlCards"
      pattern: "computeDasEstimado"
    - from: "src/app/(authed)/empresas/_lib/service.ts"
      to: "prisma/schema.prisma"
      via: "createEmpresaService/updateEmpresaService gravam aliquotaDasPercent"
      pattern: "aliquotaDasPercent"
---

<objective>
Fatia 4 — fatia vertical do **DAS estimado por empresa** (CONS-02 / D-03). Entrega, de ponta a ponta,
a capacidade de o usuário definir a alíquota (%) de uma empresa e ver o DAS estimado do mês no P&L:

1. Função pura `computeDasEstimado(aliquotaPercent, brutoCents)` + Vitest (a aritmética é
   correção-crítica: percentual × centavos com arredondamento).
2. Campo alíquota no schema/service/actions/form de empresa — o usuário edita a alíquota na tela de
   editar empresa (D-03: "editável por empresa").
3. DAS estimado renderizado no P&L da empresa ativa (/canais) como um 4º card ao lado de bruto/líquido/lucro.

Decisão (D-03): `DAS estimado = alíquota × faturamento bruto`. O faturamento bruto já é calculado por
`loadPnlData` (brutoCents). Empresa sem alíquota (null) → "não definido" na UI, não R$ 0,00 silencioso,
para o usuário saber que precisa preencher.

Purpose: Dar visibilidade do imposto estimado por empresa, reutilizando o faturamento bruto do P&L da
Fatia 2 sem nova query, e alimentar o total de DAS do consolidado (04d-03).
Output: `das.ts` + testes; alíquota editável em /empresas; card de DAS estimado em /canais.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/04d-consolidado-projecao/04d-CONTEXT.md

# Padrão de função pura + Vitest (espelhar) e o P&L onde o DAS entra
@src/app/(authed)/canais/_lib/pnl.ts
@src/app/(authed)/canais/_lib/pnl.test.ts
@src/app/(authed)/canais/_lib/loader.ts
@src/app/(authed)/canais/page.tsx
@src/app/(authed)/canais/_components/PnlCards.tsx
# Onde a alíquota é editada (schema/service/actions do CRUD de empresa + o Sheet do form)
@src/app/(authed)/empresas/_lib/schema.ts
@src/app/(authed)/empresas/_lib/service.ts
@src/app/(authed)/empresas/_lib/actions.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Função pura computeDasEstimado + testes Vitest (CONS-02 / D-03)</name>
  <files>src/app/(authed)/canais/_lib/das.ts, src/app/(authed)/canais/_lib/das.test.ts</files>
  <behavior>
    - computeDasEstimado(6, 1_000_000) === 60_000 (6% de R$ 10.000,00 = R$ 600,00)
    - computeDasEstimado(15.5, 1_000_000) === 155_000 (alíquota fracionária)
    - computeDasEstimado(null, 1_000_000) === 0 (sem alíquota → zero; a UI decide exibir "não definido")
    - computeDasEstimado(6, 0) === 0 (sem faturamento → zero)
    - Arredondamento: computeDasEstimado(6, 333) === 20 (Math.round, nunca fração de centavo)
    - Nunca negativo quando as entradas são ≥ 0 (faturamento bruto já é ≥ 0 no P&L)
  </behavior>
  <action>
    Criar `canais/_lib/das.ts` espelhando o estilo de `canais/_lib/pnl.ts` (TypeScript puro, SEM Prisma,
    SEM nada de servidor; valores em centavos Int; comentários referenciando CONS-02/D-03). Exportar:
    - `computeDasEstimado(aliquotaPercent: number | null, brutoCents: number): number` — devolve o DAS
      estimado em centavos. Fórmula D-03: `Math.round((aliquotaPercent / 100) * brutoCents)`. Se
      `aliquotaPercent` for null → retornar 0 (a decisão de mostrar "não definido" fica na UI, não aqui).
      Usar `Math.round` para resolver frações de centavo (mesma disciplina de computeAnnualMonthly em
      contas-fixas/_lib/service.ts). NÃO usar Float para o percentual multiplicado por dinheiro sem
      arredondar; sempre devolver Int.
    Criar `canais/_lib/das.test.ts` espelhando `pnl.test.ts` (describe/it/expect do vitest), cobrindo os
    casos do bloco <behavior> acima. Rodar os testes — devem PASSAR (RED→GREEN no mesmo passo, pois a fn
    é trivial; se preferir, escrever o teste primeiro e vê-lo falhar antes de criar das.ts).
  </action>
  <verify>
    <automated>npx vitest run src/app/\(authed\)/canais/_lib/das.test.ts</automated>
  </verify>
  <done>`das.ts` exporta `computeDasEstimado`; `das.test.ts` cobre arredondamento, alíquota null, faturamento zero e fração; `npx vitest run` do arquivo passa 100%.</done>
</task>

<task type="auto">
  <name>Task 2: Alíquota (%) editável por empresa — schema/service/actions/form (CONS-02 / D-03)</name>
  <files>src/app/(authed)/empresas/_lib/schema.ts, src/app/(authed)/empresas/_lib/service.ts, src/app/(authed)/empresas/_lib/actions.ts, src/app/(authed)/empresas/_components/EmpresaSheet.tsx</files>
  <action>
    Permitir que o usuário defina a alíquota do DAS por empresa, reusando o CRUD existente (D-03:
    "editável por empresa na tela de editar empresa"). Mudanças:
    - `empresas/_lib/schema.ts`: adicionar ao `empresaSchema` um campo `aliquotaDasPercent` opcional,
      aceitando número ou vazio. Usar `z.coerce.number()` com `.min(0)` e `.max(100)` dentro de um
      wrapper que trate string vazia como `null` (ex.: `z.preprocess` que converte '' / undefined para
      null, senão coage para número; depois `.nullable()`). A mensagem de erro em pt-BR: "Alíquota deve
      estar entre 0 e 100." Garantir que o tipo de ENTRADA e SAÍDA fiquem consistentes (seguir a nota já
      existente no arquivo sobre não usar `.default()` que quebra o zodResolver).
    - `empresas/_lib/service.ts`: em `createEmpresaService` e `updateEmpresaService`, incluir
      `aliquotaDasPercent` no `data` gravado (Prisma aceita number | null para o campo Decimal?). NÃO
      alterar a lógica de seed de categorias nem as checagens de posse/exclusão existentes.
    - `empresas/_lib/actions.ts`: o parse já usa `empresaSchema`/`updateEmpresaSchema`; apenas garantir
      que o novo campo passe pelo `safeParse` e chegue aos services (ajustar os tipos se necessário).
    - `empresas/_components/EmpresaSheet.tsx`: adicionar um input numérico "Alíquota do DAS (%)" ao
      formulário (react-hook-form, mesmo padrão dos campos nome/tipo/cor já presentes). Opcional; placeholder
      indicando que pode ficar em branco ("deixe em branco se ainda não definida"). Pré-carregar o valor
      atual no modo edição. Botões ≥ 44px (regra do projeto). Texto em pt-BR.
    Toda query/serviço continua ownership-guarded (where userId) — não relaxar T-04-06/T-04-09.
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -q "aliquotaDasPercent" "src/app/(authed)/empresas/_lib/schema.ts" && grep -iq "alíquota" "src/app/(authed)/empresas/_components/EmpresaSheet.tsx"</automated>
  </verify>
  <done>`empresaSchema` valida `aliquotaDasPercent` (0–100 ou null); create/update services gravam o campo; o EmpresaSheet tem um input de alíquota pré-carregado no modo edição; `npx tsc --noEmit` limpo.</done>
</task>

<task type="auto">
  <name>Task 3: DAS estimado no P&L da empresa (/canais) (CONS-02 / D-03)</name>
  <files>src/app/(authed)/canais/_lib/loader.ts, src/app/(authed)/canais/page.tsx, src/app/(authed)/canais/_components/PnlCards.tsx</files>
  <action>
    Exibir o DAS estimado do mês no P&L da empresa ativa, reutilizando o faturamento bruto já calculado
    (nenhuma query nova para o DAS):
    - `canais/page.tsx`: ao buscar a empresa (findFirst com ownership check já existente), incluir
      `aliquotaDasPercent` no `select`. Depois de `loadPnlData`, computar
      `dasEstimadoCents = computeDasEstimado(empresa.aliquotaDasPercent?.toNumber?.() ?? empresa.aliquotaDasPercent ?? null, brutoCents)`
      (o campo Decimal do Prisma vem como objeto Decimal; converter para number com segurança). Passar
      `dasEstimadoCents` e um flag `aliquotaDefinida` (empresa.aliquotaDasPercent != null) ao PnlCards.
      Importar `computeDasEstimado` de `./_lib/das`.
    - Alternativamente, se preferir manter a página fina, estender `loadPnlData` em `canais/_lib/loader.ts`
      para receber `aliquotaDasPercent` e devolver `dasEstimadoCents` dentro de `PnlData` (adicionar o campo
      à interface PnlData e computar com `computeDasEstimado`). Escolher UMA das duas abordagens e deixar
      claro no SUMMARY; a recomendada é estender `loadPnlData` para o consolidado (04d-03) reusar a mesma fn.
    - `canais/_components/PnlCards.tsx`: adicionar um 4º card "DAS estimado" (ajustar o grid de sm:grid-cols-3
      para sm:grid-cols-2 lg:grid-cols-4, mantendo rounded-2xl/bg-card/font-mono/formatBRL). Quando a
      alíquota NÃO está definida (prop `aliquotaDefinida === false`), exibir "não definido" em
      text-text-secondary em vez de formatBRL(0) — D-03. Props novas: `dasEstimadoCents: number` e
      `aliquotaDefinida: boolean`.
    pt-BR, valores via formatBRL, nenhuma mistura entre empresas (continua escopado ao empresaId do contexto).
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -q "computeDasEstimado" "src/app/(authed)/canais/page.tsx" "src/app/(authed)/canais/_lib/loader.ts" && grep -iq "DAS estimado" "src/app/(authed)/canais/_components/PnlCards.tsx"</automated>
  </verify>
  <done>O /canais mostra um card "DAS estimado" = alíquota × faturamento bruto via computeDasEstimado; empresa sem alíquota mostra "não definido"; `npx tsc --noEmit` limpo.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| navegador → Server Action (editar empresa) | A alíquota chega do form; precisa ser validada e escopada ao dono |
| navegador → página /canais | empresaId do contexto pode ser de outro usuário (IDOR) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04d-03 | Tampering | updateEmpresaAction (alíquota) | mitigate | Zod valida 0–100; `updateEmpresaService` faz findFirst por {id, userId} antes de gravar (ownership check já existente, não relaxado) |
| T-04d-04 | Information Disclosure | canais/page.tsx (empresaId do contexto) | mitigate | findFirst por {id, userId} já existente; empresa de outro usuário → placeholder, nunca P&L/DAS |
| T-04d-05 | Tampering | computeDasEstimado (aritmética) | mitigate | Função pura testada com Vitest (arredondamento, null, zero); evita fração de centavo via Math.round |
</threat_model>

<verification>
- `npx vitest run` do `das.test.ts` passa 100%.
- `npx tsc --noEmit` limpo em todo o repo.
- `grep computeDasEstimado` encontra o uso na página e/ou loader do /canais.
- Editar uma empresa e definir 6% → /canais mostra DAS estimado = 6% do faturamento bruto do mês.
- Empresa sem alíquota → card "DAS estimado: não definido".
</verification>

<success_criteria>
- Usuário define alíquota (%) por empresa e ela persiste (CONS-02 / D-03).
- /canais mostra o DAS estimado = alíquota × faturamento bruto, ou "não definido" sem alíquota.
- Função pura de DAS testada; nenhuma mistura entre empresas; tsc limpo.
</success_criteria>

<output>
Create `.planning/phases/04d-consolidado-projecao/04d-02-SUMMARY.md` when done
</output>
