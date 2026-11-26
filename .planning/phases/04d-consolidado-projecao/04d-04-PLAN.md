---
phase: 04d-consolidado-projecao
plan: 04
type: execute
wave: 3
depends_on:
  - 04d-03
files_modified:
  - src/app/(authed)/consolidado/_lib/projecao.ts
  - src/app/(authed)/consolidado/_lib/projecao.test.ts
  - src/app/(authed)/consolidado/_lib/loader.ts
  - src/app/(authed)/consolidado/page.tsx
  - src/app/(authed)/consolidado/_components/ProjecaoTable.tsx
autonomous: true
requirements:
  - CONS-03
  - CONS-04
user_setup: []

must_haves:
  truths:
    - "A tela Consolidado mostra uma projeção dos próximos meses (3–6) de quanto vai sobrar — por empresa e para a família"
    - "A UI deixa explícito que a projeção é uma ESTIMATIVA baseada na média dos últimos meses"
    - "Quando a sobra projetada de um mês fica negativa (família ou qualquer empresa), o mês é destacado e mostra quanto falta"
    - "A projeção não é cumulativa — cada mês é projetado isoladamente (não rastreamos saldo de caixa)"
  artifacts:
    - path: "src/app/(authed)/consolidado/_lib/projecao.ts"
      provides: "Funções puras: média/tendência, projeção mensal (empresa e família), detecção de mês negativo"
      min_lines: 30
    - path: "src/app/(authed)/consolidado/_lib/projecao.test.ts"
      provides: "Testes Vitest da projeção (média, projeção por mês, mês negativo, quanto falta)"
      contains: "projetarMeses"
    - path: "src/app/(authed)/consolidado/_components/ProjecaoTable.tsx"
      provides: "Tabela de projeção por mês com destaque de mês negativo + rótulo de estimativa"
      min_lines: 20
  key_links:
    - from: "src/app/(authed)/consolidado/page.tsx"
      to: "src/app/(authed)/consolidado/_lib/projecao.ts"
      via: "page renderiza a projeção via projetarMeses + detecção de negativo"
      pattern: "projetarMeses"
    - from: "src/app/(authed)/consolidado/_lib/loader.ts"
      to: "src/app/(authed)/visao-geral/_lib/service.ts"
      via: "série histórica de entradas/saídas da família (Casa) + contas fixas para a projeção"
      pattern: "getTotalEntradas|getFixedAccounts"
---

<objective>
Fatia 4 — fatia vertical da **projeção simples + alerta de saldo negativo** (CONS-03/CONS-04 / D-04/D-05),
renderizada na tela Consolidado criada em 04d-03. Entrega, de ponta a ponta:

1. Funções puras de projeção + Vitest (correção-crítica): média/tendência dos últimos ~3 meses, projeção
   mensal POR MÊS (não cumulativa — D-04: não rastreamos saldo de caixa), para cada empresa e para a família,
   e detecção de mês negativo com "quanto falta".
2. Loader estende `loadConsolidadoData` para montar a série histórica (últimos meses de lançamentos) por
   empresa e da família (Casa), somando as contas fixas da Casa às despesas esperadas.
3. UI: tabela de projeção (3–6 meses, colunas por mês como o spec §5) com destaque do mês negativo e
   rótulo honesto de que é ESTIMATIVA baseada na média.

Decisão (D-04): projeção SIMPLES, por mês, não cumulativa. Por empresa = faturamento esperado − custos
esperados − DAS estimado. Família = renda esperada (média dos pró-labores recebidos + outras entradas) −
gastos esperados (contas fixas da Casa, que têm valor, + média das despesas variáveis). "Esperado" = média
dos últimos ~3 meses de lançamentos (Discrição do Claude: janela de 3 meses). D-05: mês com sobra negativa
(família OU qualquer empresa) é destacado com quanto falta.

Caveat registrado em CONTEXT: não há saldo de caixa cumulativo; cada mês é uma estimativa independente. A UI
precisa dizer isso claramente ("estimativa baseada na média dos últimos meses").

Purpose: Responder "quanto vai sobrar nos próximos meses" de forma honesta e alertar meses apertados, sem
prometer precisão que o modelo atual não tem.
Output: `projecao.ts` + testes; projeção renderizada em /consolidado com alerta de mês negativo.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/04d-consolidado-projecao/04d-CONTEXT.md

# A tela Consolidado onde a projeção é renderizada + seu loader/funções puras
@src/app/(authed)/consolidado/page.tsx
@src/app/(authed)/consolidado/_lib/loader.ts
@src/app/(authed)/consolidado/_lib/consolidado.ts
# Fontes de dados: entradas/saídas por mês (série histórica) e contas fixas da Casa
@src/app/(authed)/visao-geral/_lib/service.ts
@src/app/(authed)/contas-fixas/_lib/service.ts
@src/app/(authed)/canais/_lib/das.ts
# Padrão de função pura + Vitest a espelhar + uso de date-fns para meses
@src/app/(authed)/visao-geral/_lib/renda-familiar.ts
@src/app/(authed)/contas-fixas/_lib/service.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Funções puras de projeção + detecção de mês negativo + testes Vitest (CONS-03/CONS-04 / D-04/D-05)</name>
  <files>src/app/(authed)/consolidado/_lib/projecao.ts, src/app/(authed)/consolidado/_lib/projecao.test.ts</files>
  <behavior>
    - mediaUltimosMeses([100_000, 200_000, 300_000]) === 200_000 (média simples, Math.round)
    - mediaUltimosMeses([]) === 0 (sem histórico → zero, não NaN)
    - projetarMeses: dado receita esperada, custo esperado e DAS esperado, cada mês projetado = receita − custo − DAS; projeção de N meses devolve N linhas, uma por mês, NÃO cumulativa (cada mês independe do anterior)
    - sobra negativa: quando receita − custo − DAS < 0, a linha marca negativo:true e faltamCents = valor absoluto da sobra (quanto falta)
    - sobra positiva ou zero: negativo:false, faltamCents 0
    - família: projeção = renda esperada − (contas fixas + média de despesas variáveis); mesmas regras de negativo
    - rótulos de mês gerados a partir do mês-base avançando com date-fns (ex.: 2026-11 + 3 meses → 2026-12, 2027-01, 2027-02); nunca estoura virada de ano (não hand-roll de mês)
  </behavior>
  <action>
    Criar `consolidado/_lib/projecao.ts` espelhando o estilo das funções puras do projeto (TypeScript puro,
    SEM Prisma/servidor; centavos Int; comentários referenciando CONS-03/CONS-04/D-04/D-05). Para avançar meses
    usar date-fns (addMonths + format, importando de 'date-fns' e o locale ptBR quando formatar rótulo), NÃO
    fazer aritmética de mês na mão (precedente contas-fixas/_lib/service.ts usa date-fns para meses). Exportar:
    - `mediaUltimosMeses(valoresCents: number[]): number` — média simples com Math.round; lista vazia → 0.
    - `interface MesProjetado { mesLabel: string; sobraCents: number; negativo: boolean; faltamCents: number }`.
    - `projetarSobraMensal(receitaEsperadaCents, custoEsperadoCents, dasEsperadoCents): { sobraCents, negativo, faltamCents }`
      — sobra = receita − custo − das; negativo = sobra < 0; faltamCents = negativo ? -sobra : 0. (Família usa a
      mesma fn passando dasEsperadoCents = 0 e custoEsperado = contasFixas + médiaVariáveis.)
    - `projetarMeses(mesBase: string, numMeses: number, receitaEsperadaCents, custoEsperadoCents, dasEsperadoCents): MesProjetado[]`
      — gera `numMeses` linhas (3 a 6) a partir do mês seguinte ao mesBase, cada uma com o mesmo cálculo não
      cumulativo (D-04) e o rótulo do mês via date-fns. numMeses fora de 3..6 deve ser clamped a esse intervalo.
    - `algumMesNegativo(linhas: MesProjetado[]): boolean` — conveniência para a UI destacar (D-05).
    Criar `consolidado/_lib/projecao.test.ts` espelhando service.test.ts/renda-familiar.test.ts, cobrindo os
    casos do bloco <behavior> (média, vazio, projeção N meses não cumulativa, mês negativo + quanto falta,
    virada de ano nos rótulos). Rodar e ver passar.
  </action>
  <verify>
    <automated>npx vitest run src/app/\(authed\)/consolidado/_lib/projecao.test.ts</automated>
  </verify>
  <done>`projecao.ts` exporta `mediaUltimosMeses`, `projetarSobraMensal`, `projetarMeses`, `algumMesNegativo` + a interface MesProjetado; os testes cobrem média/vazio, projeção não cumulativa de N meses, mês negativo com faltamCents e virada de ano; `npx vitest run` do arquivo passa 100%.</done>
</task>

<task type="auto">
  <name>Task 2: Loader da série histórica (empresas + família) e projeção no loadConsolidadoData (CONS-03 / D-04)</name>
  <files>src/app/(authed)/consolidado/_lib/loader.ts</files>
  <action>
    Estender `loadConsolidadoData` (ou adicionar `loadProjecaoData(userId, month, numMeses = 3)` no mesmo loader)
    para montar as séries históricas que alimentam as funções puras de projeção — tudo ownership-guarded (where
    userId; nenhuma query sem escopo):
    - Para a janela de ~3 meses anteriores ao mês atual, montar os meses 'YYYY-MM' via date-fns (subMonths) e,
      por empresa, buscar `getTotalEntradas` e `getTotalSpent` (visao-geral/_lib/service, já empresaId-aware) de
      cada mês; passar as séries a `mediaUltimosMeses` para obter receita/custo esperados. O DAS esperado da
      empresa = `computeDasEstimado(empresa.aliquotaDasPercent, receitaEsperada)` (reusa a fn de 04d-02 sobre a
      receita MÉDIA projetada). Então `projetarMeses(mesBase, numMeses, receitaEsp, custoEsp, dasEsp)` por empresa.
    - Para a FAMÍLIA (Casa, empresaId null): série de entradas da Casa (getTotalEntradas null) para a renda
      esperada; despesas esperadas = contas fixas da Casa (`getFixedAccounts` → soma dos amountCents, que têm
      valor e são obrigações datadas) + média das SAÍDAS variáveis da Casa dos últimos meses (getTotalSpent null
      menos as contas fixas, ou a média direta das SAIDAs — escolher e documentar; o CONTEXT pede "contas fixas +
      média das despesas variáveis"). Projetar a família com `projetarMeses(mesBase, numMeses, rendaEsp,
      despesaEsp, 0)` (família não tem DAS).
    - Devolver, junto do consolidado já existente, `{ projecaoFamilia: MesProjetado[], projecaoPorEmpresa:
      Array<{ empresaId, nome, cor, meses: MesProjetado[] }> }`. NÃO quebrar o retorno atual de
      loadConsolidadoData (04d-03) — adicionar campos, não remover.
    Observação de desempenho: as buscas por mês/empresa devem ir em Promise.all (padrão loadDashboardData), não
    em série. numMeses default 3 (Discrição do Claude; a UI pode oferecer 6 depois).
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -q "projetarMeses" "src/app/(authed)/consolidado/_lib/loader.ts" && grep -q "mediaUltimosMeses" "src/app/(authed)/consolidado/_lib/loader.ts"</automated>
  </verify>
  <done>O loader monta a série histórica dos últimos ~3 meses por empresa e da família, aplica mediaUltimosMeses + projetarMeses, e devolve projecaoFamilia + projecaoPorEmpresa sem quebrar o retorno existente; toda query filtra por userId; `npx tsc --noEmit` limpo.</done>
</task>

<task type="auto">
  <name>Task 3: Tabela de projeção com alerta de mês negativo + rótulo de estimativa na tela Consolidado (CONS-03/CONS-04 / D-04/D-05)</name>
  <files>src/app/(authed)/consolidado/page.tsx, src/app/(authed)/consolidado/_components/ProjecaoTable.tsx</files>
  <action>
    Renderizar a projeção na tela /consolidado (abaixo da tabela de totais do 04d-03):
    - `consolidado/_components/ProjecaoTable.tsx`: componente que recebe `meses: MesProjetado[]` e um `titulo`
      (ex.: "Projeção — Família" ou o nome da empresa). Exibe colunas por mês (mesLabel) com a sobra projetada
      (formatBRL), no espírito do fluxo de caixa por mês do spec §5. Mês com `negativo === true` destacado
      (ex.: text-warning/bg de alerta) mostrando "faltam {formatBRL(faltamCents)}" (D-05). Inclui um rótulo
      explícito e visível de que é ESTIMATIVA baseada na média dos últimos meses (D-04) — ex.: uma linha de
      ajuda em text-text-secondary. Estilo rounded-2xl/bg-card consistente com os demais componentes. pt-BR,
      ≥44px em qualquer controle. Responsivo (scroll horizontal no mobile se necessário).
    - `consolidado/page.tsx`: consumir os novos campos do loader (projecaoFamilia + projecaoPorEmpresa) e
      renderizar uma `ProjecaoTable` para a família e uma por empresa. O destaque de negativo usa diretamente
      a flag `negativo`/`faltamCents` de cada MesProjetado (não recalcular na UI). Se não houver histórico
      suficiente (séries zeradas), a projeção mostra zeros com o rótulo de estimativa — não quebrar.
    NÃO colocar código de cálculo no componente/página: o cálculo vive nas funções puras (projecao.ts) testadas.
  </action>
  <verify>
    <automated>npx tsc --noEmit && grep -q "ProjecaoTable" "src/app/(authed)/consolidado/page.tsx" && grep -iq "estimativa" "src/app/(authed)/consolidado/_components/ProjecaoTable.tsx" && grep -iq "faltam" "src/app/(authed)/consolidado/_components/ProjecaoTable.tsx"</automated>
  </verify>
  <done>/consolidado mostra a projeção da família e por empresa em colunas por mês; mês com sobra negativa é destacado com "faltam R$ ..."; há um rótulo visível de "estimativa baseada na média"; o cálculo vem das funções puras; `npx tsc --noEmit` limpo.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| navegador → página /consolidado (projeção) | Requisição autenticada; a projeção agrega histórico de todas as empresas + Casa do usuário |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04d-09 | Information Disclosure | loadProjecaoData (séries históricas) | mitigate | Toda query (getTotalEntradas/getTotalSpent/getFixedAccounts) filtra por userId; a projeção só usa dados do próprio usuário — nenhuma mistura entre empresas nem entre usuários |
| T-04d-10 | Tampering | funções de projeção (aritmética) | mitigate | Funções puras testadas com Vitest (média, não cumulativo, negativo + quanto falta, virada de ano); o cálculo não vive na UI |
| T-04d-11 | Repudiation (confiança indevida) | ProjecaoTable | accept | Risco de o usuário tratar estimativa como certeza mitigado por rótulo explícito de "estimativa baseada na média" (D-04); projeção completa com DAS real/dívidas é fatia futura (Deferred Ideas) |
</threat_model>

<verification>
- `npx vitest run` do `projecao.test.ts` passa 100% (média, projeção não cumulativa, mês negativo + faltamCents, virada de ano).
- `npx tsc --noEmit` limpo.
- /consolidado mostra projeção da família e por empresa em colunas por mês; o rótulo de estimativa aparece.
- Forçar um mês projetado negativo (histórico de gastos > renda) → o mês é destacado com "faltam R$ ...".
- Projeção não cumulativa: cada mês reflete o mesmo cálculo médio, não um saldo acumulado.
</verification>

<success_criteria>
- Projeção simples de 3–6 meses (por empresa e família), não cumulativa, baseada na média dos últimos ~3 meses (CONS-03 / D-04).
- Alerta de mês negativo (família E por empresa) com quanto falta (CONS-04 / D-05).
- UI deixa claro que é estimativa; cálculo em funções puras testadas; nenhuma mistura entre empresas; tsc limpo.
</success_criteria>

<output>
Create `.planning/phases/04d-consolidado-projecao/04d-04-SUMMARY.md` when done
</output>
