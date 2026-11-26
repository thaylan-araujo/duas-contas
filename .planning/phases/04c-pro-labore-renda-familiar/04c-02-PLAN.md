---
phase: 04c-pro-labore-renda-familiar
plan: 02
type: execute
wave: 1
depends_on:
  - 04c-01
files_modified:
  - src/app/(authed)/lancamentos/_lib/service.ts
  - src/app/(authed)/lancamentos/_lib/service.test.ts
  - src/app/(authed)/lancamentos/_lib/schema.ts
  - src/app/(authed)/lancamentos/_lib/actions.ts
  - src/app/(authed)/lancamentos/_components/TransactionSheet.tsx
autonomous: false
requirements:
  - PL-01
  - PL-02
  - PL-03
  - PL-04
  - PL-06
user_setup: []

must_haves:
  truths:
    - "Com uma empresa ativa, o usuário escolhe 'Pró-labore', informa valor e data, e uma única operação cria o par atômico"
    - "O par tem uma SAÍDA na empresa (categoria 'Pró-labore', custo) e uma ENTRADA na Casa (empresaId null), ligadas por pairId"
    - "A ENTRADA da Casa e a SAÍDA da empresa carregam origemEmpresaId = a empresa de origem"
    - "A categoria 'Pró-labore' é garantida (getOrCreate) na empresa (CUSTO) e na Casa (null kind)"
    - "O par aparece como somente-leitura e só pode ser excluído inteiro (edição/exclusão individual bloqueada)"
  artifacts:
    - path: "src/app/(authed)/lancamentos/_lib/service.ts"
      provides: "createProLaboreService reabilitado (par atômico multi-empresa) + getOrCreate categoria Pró-labore"
      contains: "prisma.$transaction"
    - path: "src/app/(authed)/lancamentos/_lib/service.test.ts"
      provides: "Testes Vitest do par atômico (saída/entrada, pairId, origemEmpresaId, categorias)"
    - path: "src/app/(authed)/lancamentos/_lib/schema.ts"
      provides: "proLaboreSchema com origemEmpresaId obrigatório"
      contains: "origemEmpresaId"
    - path: "src/app/(authed)/lancamentos/_components/TransactionSheet.tsx"
      provides: "Fluxo 'Aplicar pró-labore' reabilitado com empresa de origem = contexto ativo"
  key_links:
    - from: "src/app/(authed)/lancamentos/_components/TransactionSheet.tsx"
      to: "src/app/(authed)/lancamentos/_lib/actions.ts"
      via: "createProLaboreAction chamado no onSubmit quando isProLabore"
      pattern: "createProLaboreAction"
    - from: "src/app/(authed)/lancamentos/_lib/service.ts"
      to: "prisma/schema.prisma"
      via: "prisma.$transaction cria 2 linhas com pairId e origemEmpresaId"
      pattern: "origemEmpresaId"
---

## Phase Goal

**As a** dono das minhas empresas, **I want to** aplicar o pró-labore de cada empresa para a Casa, **so that** o dinheiro chegue na família como uma transferência explícita e rastreável — sem misturar as contas.

<objective>
Fatia vertical principal: reabilitar o fluxo "Aplicar pró-labore" no mundo multi-empresa (PL-01), hoje DESABILITADO desde a Fatia 1 (createProLaboreService lança erro de deferimento; a opção no TransactionSheet é no-op/disabled). Ao fim deste plano, com uma empresa ativa no seletor global, o usuário escolhe "Pró-labore", informa valor e data, e UMA única operação cria atomicamente o par: SAÍDA na empresa (categoria "Pró-labore", conta como custo) + ENTRADA na Casa (empresaId null, categoria "Pró-labore"), ligadas por `pairId`, ambas marcadas com `origemEmpresaId` = a empresa de origem (campo criado em 04c-01).

Reaproveita o par atômico de pró-labore da Fase 2 (`prisma.$transaction`, `pairId`, D-05/D-06 do 02-CONTEXT) e o caminho do TransactionSheet (D-02 permite reabilitar o caminho existente OU um fluxo dedicado — escolhido reabilitar o caminho existente por ser o mais simples e reusar toda a UI do Sheet). A empresa de origem = o contexto ativo (quando uma empresa está selecionada no ContaSelector global); o fluxo não é oferecido no contexto Casa (não há empresa de origem). A categoria "Pró-labore" é garantida por getOrCreate na empresa (kind CUSTO) e na Casa (kind null) — PL-02.

Efeitos já cobertos por fatias anteriores, confirmados aqui (sem código novo): o pró-labore reduz o lucro da empresa porque é um custo SAÍDA normal no P&L da Fatia 2 (PL-03 — computeLucro = receitas − todos os custos; nada a excluir), e soma no "Dinheiro do mês" da Casa porque é uma ENTRADA (PL-04 — getTotalEntradas da Fatia 3.5 já conta). A edição/exclusão individual permanece bloqueada (pairId guard em updateTransactionService/deleteTransactionService); a exclusão é atômica do par inteiro (PL-06 / D-06).

Purpose: Entregar a capacidade central da Fatia 3 — aplicar pró-labore de cada empresa para a Casa, atômico e rastreável por origem.
Output: service/schema/actions do pró-labore reabilitados e empresaId-aware; testes Vitest do par atômico; TransactionSheet com a opção "Pró-labore" habilitada no contexto de empresa.
</objective>

<execution_context>
@$HOME/.claude/gsd-core/workflows/execute-plan.md
@$HOME/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/04c-pro-labore-renda-familiar/04c-CONTEXT.md

# Código a adaptar (pró-labore desabilitado) + padrões de referência
@src/app/(authed)/lancamentos/_lib/service.ts
@src/app/(authed)/lancamentos/_lib/schema.ts
@src/app/(authed)/lancamentos/_lib/actions.ts
@src/app/(authed)/lancamentos/_components/TransactionSheet.tsx
# Padrão getOrCreate/getOrSeed categoria por empresa (upsert na chave composta)
@src/app/(authed)/empresas/_lib/service.ts
# Como o contexto de empresa ativa chega (searchParams.empresaId / store)
@src/store/conta.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Teste RED do par atômico de pró-labore multi-empresa (PL-01/PL-02/PL-06)</name>
  <files>src/app/(authed)/lancamentos/_lib/service.test.ts</files>
  <behavior>
    Escrever primeiro os testes Vitest que descrevem o comportamento esperado de
    `createProLaboreService` reabilitado (devem FALHAR agora — o service ainda lança o erro de
    deferimento). Mockar o Prisma client (padrão de src/app/(authed)/empresas/_lib/service.test.ts:
    vi.mock de '@/lib/prisma', inspecionando as chamadas de $transaction/create/upsert). Casos:
    - Dado userId + origemEmpresaId (empresa válida) + amountCents + date: cria EXATAMENTE duas
      transactions numa única `prisma.$transaction`.
    - A SAÍDA tem type SAIDA, empresaId = origemEmpresaId, origemEmpresaId = origemEmpresaId,
      categoria "Pró-labore" da empresa (kind CUSTO).
    - A ENTRADA tem type ENTRADA, empresaId null (Casa), origemEmpresaId = origemEmpresaId,
      categoria "Pró-labore" da Casa (kind null).
    - Ambas as linhas compartilham o MESMO pairId (não null).
    - A categoria "Pró-labore" é obtida/criada (getOrCreate) na empresa e na Casa — rodar duas vezes
      não duplica (upsert na chave composta name_empresaId_userId).
    - IDOR: se a empresa de origem não pertence ao userId, o service lança erro e NÃO cria nada.
    Também adicionar/ajustar um caso garantindo que o guard de edição/exclusão individual continua:
    updateTransactionService e deleteTransactionService lançam 'PAIRED_TRANSACTION' quando pairId != null
    (esse comportamento já existe — o teste trava a regressão).
  </behavior>
  <action>
    Criar `src/app/(authed)/lancamentos/_lib/service.test.ts` com os casos acima. Seguir o estilo de
    mock de empresas/_lib/service.test.ts (vi.mock('@/lib/prisma'), asserções sobre os argumentos de
    create/upsert/$transaction). Os testes do par atômico DEVEM falhar agora (RED) porque
    createProLaboreService ainda lança PRO_LABORE_DEFERRED_MESSAGE. NÃO implementar o service nesta task.
    Commitar como teste RED: `test(04c-02): add failing tests for pró-labore multi-empresa pair`.
  </action>
  <verify>
    <automated>npx vitest run src/app/\(authed\)/lancamentos/_lib/service.test.ts 2>&1 | grep -qiE "fail|×|✗"</automated>
  </verify>
  <done>service.test.ts existe com os casos do par atômico (saída/entrada, pairId compartilhado, origemEmpresaId nas duas linhas, categorias getOrCreate, IDOR) e falha de propósito (RED) porque o service ainda está desabilitado.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Reabilitar createProLaboreService (par atômico multi-empresa) + getOrCreate categoria Pró-labore + schema/actions (PL-01/PL-02/PL-03/PL-04)</name>
  <files>src/app/(authed)/lancamentos/_lib/service.ts, src/app/(authed)/lancamentos/_lib/schema.ts, src/app/(authed)/lancamentos/_lib/actions.ts</files>
  <behavior>
    Fazer os testes da Task 1 passarem (GREEN) sem quebrar nenhum teste existente (atualmente 95/95).
  </behavior>
  <action>
    schema.ts — estender `proLaboreSchema`: adicionar `origemEmpresaId: z.string().min(1, 'Selecione a empresa de origem.')`
    (obrigatório — o pró-labore sempre sai de uma empresa específica). Manter date e amountCents.
    REMOVER a exigência de `categoryId` do form do pró-labore: a categoria "Pró-labore" passa a ser
    resolvida pelo service via getOrCreate (não é mais escolhida no form — PL-02). Manter o tipo
    ProLaboreFormData exportado coerente com o novo shape.

    service.ts — substituir o corpo de `createProLaboreService` (hoje lança PRO_LABORE_DEFERRED_MESSAGE)
    pela implementação real multi-empresa:
    1. Validar posse da empresa de origem (IDOR, ASVS V4): `prisma.empresa.findFirst({ where: { id: origemEmpresaId, userId } })`; se não existir, lançar 'Empresa não encontrada.' e não gravar nada.
    2. getOrCreate da categoria "Pró-labore" na empresa (empresaId = origemEmpresaId, kind CUSTO) e na
       Casa (empresaId null, kind null), via `prisma.category.upsert` na chave composta
       name_empresaId_userId — mesmo padrão idempotente de getOrSeedCategorias em empresas/_lib/service.ts.
       Para a Casa (empresaId null) usar o upsert com NULLS NOT DISTINCT já existente no schema; se o
       input composto do Prisma recusar empresaId null (pitfall 04-02 #2), fazer findFirst + create como fallback.
    3. Criar o par numa única `prisma.$transaction`: gerar um pairId compartilhado (ex.: crypto.randomUUID()),
       criar a SAÍDA (type SAIDA, empresaId = origemEmpresaId, origemEmpresaId = origemEmpresaId, categoryId
       da categoria da empresa, description "Pró-labore", amountCents, date via parseISO, pairId) e a ENTRADA
       (type ENTRADA, empresaId null, origemEmpresaId = origemEmpresaId, categoryId da categoria da Casa,
       description "Pró-labore", amountCents, date, pairId). Usar parseISO para a data (evita drift de timezone,
       padrão do projeto). Remover PRO_LABORE_DEFERRED_MESSAGE (não é mais usado). deleteProLaboreService
       permanece como está (já apaga ambas as linhas por pairId + userId, atômico).

    actions.ts — ajustar `createProLaboreAction` para o novo shape (origemEmpresaId no data, sem categoryId).
    Manter o padrão de Server Action fina já existente: safeParse → getUserId da sessão (NUNCA do form) →
    service → revalidatePath('/lancamentos') e '/visao-geral' e '/canais' (o pró-labore afeta o P&L da empresa
    também). Em erro de IDOR/empresa, devolver a mensagem do service; caso contrário a mensagem genérica
    existente.
  </action>
  <verify>
    <automated>npx vitest run src/app/\(authed\)/lancamentos/_lib/service.test.ts && npx tsc --noEmit</automated>
  </verify>
  <done>Todos os testes de service.test.ts passam (GREEN); createProLaboreService cria o par atômico com pairId compartilhado e origemEmpresaId nas duas linhas, categoria "Pró-labore" garantida na empresa (CUSTO) e na Casa; IDOR bloqueia empresa de outro usuário; `npm test` continua verde no resto; tsc limpo.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Reabilitar o fluxo "Aplicar pró-labore" no TransactionSheet (origem = contexto ativo) (PL-01/PL-06)</name>
  <files>src/app/(authed)/lancamentos/_components/TransactionSheet.tsx</files>
  <behavior>
    Reabilitar a opção "Pró-labore" do Select de Tipo quando o contexto ativo é uma empresa
    (empresaIdContexto != null). No contexto Casa (empresaIdContexto null) a opção fica desabilitada
    com rótulo explicativo (não há empresa de origem na Casa).
  </behavior>
  <action>
    Reabilitar o caminho do pró-labore (D-02: adaptar o caminho existente). Mudanças no TransactionSheet:
    - `handleTipoChange`: quando value === PRO_LABORE_SENTINEL e empresaIdContexto != null, setar
      setIsProLabore(true) (remover o no-op atual). No contexto Casa, manter desabilitado.
    - O SelectItem do PRO_LABORE_SENTINEL: `disabled={empresaIdContexto === null}`; rótulo
      "Pró-labore (saída → Casa)" quando habilitado, "Pró-labore (selecione uma empresa)" quando na Casa.
    - `onSubmit` no ramo isProLabore: montar o ProLaboreFormData com o NOVO shape — { date, amountCents,
      origemEmpresaId: empresaIdContexto } (SEM categoryId; a categoria é resolvida no service). Como
      origemEmpresaId vem do contexto (não do form), não precisa de campo de UI novo; em pró-labore mode,
      esconder o Select de Categoria (a categoria é fixa "Pró-labore"). Manter a descrição fixa "Pró-labore"
      (já é escondida no form em modo pró-labore) e o texto auxiliar "Uma única operação cria os dois
      lançamentos atomicamente."
    - Manter intacto o ramo read-only do par (isPaired) que já mostra "Este lançamento faz parte de um
      pró-labore." + botão "Excluir pró-labore" (PL-06) — apenas confirmar que continua funcionando.
    Garantir que o TransactionSheet recebe empresaIdContexto (já recebe via prop, passado por
    NewTransactionButton/TransactionList a partir de page.tsx searchParams.empresaId). Não introduzir
    fenced code; apenas descrever. tsc deve ficar limpo após o ajuste do shape do ProLaboreFormData.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run build</automated>
  </verify>
  <done>No contexto de empresa, a opção "Pró-labore" é selecionável e abre o modo pró-labore (valor + data, categoria oculta); no contexto Casa fica desabilitada com rótulo explicativo; onSubmit envia origemEmpresaId = contexto; o par criado aparece como read-only e só exclui inteiro; tsc + build limpos.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4: Verificação humana — aplicar pró-labore de uma empresa e conferir o par</name>
  <what-built>
    O fluxo "Aplicar pró-labore" reabilitado: com uma empresa ativa, o usuário cria o pró-labore e o
    sistema grava o par atômico (saída na empresa + entrada na Casa) com a origem rastreável, reduzindo
    o lucro da empresa (P&L) e somando no Dinheiro do mês da Casa.
  </what-built>
  <how-to-verify>
    1. Rode `npm run dev` e faça login.
    2. No seletor global de conta (topo), selecione uma empresa (ex.: Elite Juris).
    3. Vá em Lançamentos → "Novo lançamento" → Tipo = "Pró-labore". Confirme que a opção está habilitada
       (no contexto de empresa). Informe um valor (ex.: 1.000,00) e uma data no mês atual. Salve.
    4. Confirme na lista de Lançamentos da EMPRESA: aparece uma SAÍDA "Pró-labore" de R$ 1.000,00.
    5. Troque o seletor para "Casa". Em Lançamentos da Casa: aparece uma ENTRADA "Pró-labore" de R$ 1.000,00.
    6. Clique no lançamento do par (em qualquer lado): deve abrir em modo somente-leitura com o botão
       "Excluir pró-labore" (não dá para editar campos individualmente).
    7. Vá em Canais (com a empresa ativa): o LUCRO deve ter caído em R$ 1.000,00 (o pró-labore é custo).
    8. Vá em Visão Geral (Casa): o "Dinheiro do mês" deve ter subido em R$ 1.000,00.
    9. Volte ao contexto Casa e tente criar um pró-labore: a opção "Pró-labore" deve estar DESABILITADA
       (não há empresa de origem na Casa).
    10. (Opcional) Exclua o pró-labore pelo botão "Excluir pró-labore" e confirme que os DOIS lançamentos
        somem juntos.
  </how-to-verify>
  <resume-signal>Digite "approved" se o par, o P&L e o Dinheiro do mês baterem, ou descreva o que ficou errado.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| cliente → Server Action | Form do pró-labore (valor, data, empresa de origem) cruza para o servidor; input não confiável |
| Server Action → banco | A empresa de origem informada pode não pertencer ao usuário (IDOR) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04c-04 | Spoofing | createProLaboreAction (userId) | mitigate | userId SEMPRE lido de supabase.auth.getUser() na action, NUNCA do form (padrão getUserId existente) |
| T-04c-05 | Elevation of Privilege (IDOR) | createProLaboreService (origemEmpresaId) | mitigate | Validar `prisma.empresa.findFirst({ where: { id: origemEmpresaId, userId } })` ANTES de criar o par; empresa de outro usuário → erro, nada gravado |
| T-04c-06 | Tampering | proLaboreSchema | mitigate | Zod valida amountCents int positivo, date não vazia, origemEmpresaId não vazio no servidor |
| T-04c-07 | Tampering (integridade do par) | prisma.$transaction | mitigate | As duas linhas são criadas na mesma transação; falha parcial não deixa par órfão; pairId guard impede edição/exclusão individual |
| T-04c-SC | Tampering | npm/pip/cargo installs | accept | Nenhum pacote novo instalado nesta fatia (reusa stack existente) |
</threat_model>

<verification>
- `npx vitest run` passa (os novos testes do par + os 95 existentes).
- `npx tsc --noEmit` limpo.
- `npm run build` sem erros.
- Verificação humana (Task 4): par criado corretamente, P&L e Dinheiro do mês atualizados, opção desabilitada na Casa.
</verification>

<success_criteria>
- Com empresa ativa, o usuário aplica o pró-labore e o par atômico é criado (saída empresa + entrada Casa, pairId compartilhado, origemEmpresaId nas duas linhas).
- Categoria "Pró-labore" garantida (getOrCreate) na empresa (CUSTO) e na Casa (null kind).
- IDOR bloqueado: empresa de origem deve pertencer ao usuário.
- Edição/exclusão individual bloqueada; exclusão do par é atômica (PL-06).
- Pró-labore reduz o lucro da empresa (PL-03, custo) e soma no Dinheiro do mês da Casa (PL-04, entrada) — confirmado na verificação humana.
</success_criteria>

<output>
Create `.planning/phases/04c-pro-labore-renda-familiar/04c-02-SUMMARY.md` when done
</output>
