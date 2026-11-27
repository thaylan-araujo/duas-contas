# Design — Casa: Pago e A Pagar (status + vencimento nas despesas)

**Data:** 27/11/2026
**Status:** Em revisão (aguardando aprovação do Thaylan)
**Fase:** 10 (roadmap)
**Mockup aprovado:** `.superpowers/brainstorm/.../casa-mes.html` (visão do mês da Casa — hero "posso gastar ainda" + contas fixas com status + variável da semana)

---

## 1. Intenção e o porquê

O Thaylan controla o mês hoje no Notion somando **todas as despesas — pagas E a pagar** — pra saber
**quanto pode gastar**. No Duas Contas, uma despesa só existe depois de lançada, e as **contas fixas
ficam numa lista separada que não entra no cálculo** do saldo. Resultado: o número de "quanto sobra"
não bate com a realidade — foi a queixa dele ("registro a despesa fixa e ela não aparece na dedução").

Esta fase dá às despesas um **estado (pago / em aberto) com data de vencimento**, faz as **contas fixas
entrarem sozinhas como "em aberto" todo mês**, e passa a **descontar tudo (fixo pago + fixo em aberto +
variável) do dinheiro do mês** — mostrando numa tela bonita o número que importa: **quanto ainda posso
gastar**. É o que falta pro Thaylan largar o Notion e usar o app 100% a partir de dezembro/2026.

## 2. Objetivos

- Toda **despesa** da Casa tem **status `pago` ou `em aberto`** e um **vencimento**.
- As **contas fixas** (FixedAccount) **entram automaticamente como "em aberto" todo mês**, com vencimento:
  as de valor certo (aluguel) já com o valor; as de valor variável (luz, água) como **"a definir"**.
- **"Marcar como pago"** numa despesa em aberto (preenchendo o valor real, no caso das "a definir").
- A **conta do mês** passa a ser: **dinheiro do mês − (fixas pagas + fixas em aberto) − variável = posso gastar**.
  A despesa em aberto **conta no comprometido** (dinheiro ainda na conta, mas já reservado), sem **contar duas vezes** quando paga.
- **Tela da Casa no formato do mockup**: hero "posso gastar ainda" + barra de comprometido; contas fixas com
  pílula de status e vencimento; variável da semana com o teto (R$ 500) e tetos por categoria.
- Reaproveitar o que já existe: dinheiro do mês (= entradas/pró-labore), tetos por categoria, acompanhamento semanal, lançamentos.

## 3. Não-objetivos (fora desta fase)

- **"A pagar/a receber" das empresas** (impostos a pagar, comissões a receber) — o campo de status fica
  disponível no modelo, mas a **UX desta fase é só a Casa**; a parte de empresa vem depois.
- **Recorrências genéricas** além das contas fixas (ex.: parcelas que se geram sozinhas) — nesta fase as
  parcelas continuam sendo lançamentos normais (podem receber status, mas não há gerador de parcelas).
- **Projeção de meses futuros** com base nos "a pagar" — a projeção atual (Consolidado) não muda aqui.
- **Notificação/alerta de vencimento** (isso é a Fase 5, Calendário) — aqui só o status e a data.

## 4. Anti-objetivos (o que seria fracasso mesmo "funcionando")

- **Contar a mesma despesa duas vezes** (uma vez como "em aberto", de novo como "pago") — o número de
  "posso gastar" tem que ficar certo na transição em aberto → pago.
- **Recriar contas fixas duplicadas** no mês (gerar a mesma fixa duas vezes).
- **Quebrar a Casa que já funciona** (dinheiro do mês, tetos, semanal) nem afetar as empresas.
- Ficar "uma lista como o Notion" — tem que ser **visual e organizado** (foi o pedido explícito).

## 5. Restrições

- Reusar a Casa já construída (Fase 3.5): `dinheiro do mês` = soma das entradas; `CategoryBudget` (tetos);
  acompanhamento semanal; `FixedAccount` (contas fixas).
- pt-BR; **R$ 1.234,56**; **dd/mm/aaaa**; dinheiro em **centavos Int**; formatação só via `src/lib/format.ts`.
- Casa = `empresaId null`. Migração **aditiva** (campos novos; nunca destrutiva); backup antes; DIRECT_URL/5432; nunca shadow-db no banco real.
- Mobile-first (o uso real é no celular).

## 6. Abordagens consideradas (como representar o "em aberto")

### A) Status no próprio lançamento (Transaction) — **ESCOLHIDA**
Adicionar a `Transaction` os campos **`status` (`pago`|`em_aberto`)**, **`dueDate`** (vencimento) e
**`estimatedCents?`** (estimativa pras "a definir"). Uma despesa "em aberto" é um lançamento com
`status = em_aberto` (ainda não pago). As contas fixas **geram um lançamento "em aberto" por mês**.
- **A favor:** bate exatamente com o modelo mental do Thaylan ("tudo é uma despesa com status, eu somo tudo");
  uma coisa só pra ler/listar; o "gasto real" é `status=pago`, o "comprometido" é `pago+em_aberto` — contas simples;
  marcar pago é só mudar o status (e preencher valor nas "a definir"); sem reconciliar dois modelos.
- **Contra:** `Transaction` é compartilhado com as empresas — um lançamento "em aberto" não é caixa de verdade,
  então relatórios de "gasto real" precisam filtrar por `status=pago` onde isso importa. Mitigação: default
  `status=pago` (lançamento comum = já aconteceu); só fixas-geradas e "a pagar" explícitos nascem `em_aberto`.

### B) Modelo separado "A Pagar" que vira lançamento ao pagar
Uma tabela `Conta a pagar` (valor/vencimento/status); ao pagar, cria um `Transaction`.
- **A favor:** separa limpo "comprometido" de "caixa real".
- **Contra (decisivo):** vira **3 conceitos** (FixedAccount + A Pagar + Transaction) pra reconciliar; risco de
  contagem dupla na conversão; mais complexo e mais lento de entregar. Não combina com "tudo numa visão só".

### C) Em aberto calculado (virtual), sem gravar linha
Derivar as fixas "em aberto" em tempo de tela, sem persistir.
- **A favor:** zero migração de dados por linha.
- **Contra:** não dá pra **guardar o valor real da luz/água** daquele mês nem **marcar pago** item a item de
  forma persistente. Como o Thaylan preenche valor e marca pago por conta, precisamos de linha. Rejeitada.

**Escolha: A.** Status no lançamento + contas fixas geram um "em aberto" por mês. Simples, fiel ao modelo
mental, rápido de entregar, e conserta a queixa original sem contagem dupla.

## 7. Desenho decidido

### Dados (migração aditiva)
- `Transaction`: **`status` enum (`PAGO`|`EM_ABERTO`, default `PAGO`)**, **`dueDate` DateTime? (@db.Date)**,
  **`estimatedCents` Int?** (estimativa pras "a definir"), e **`fixedAccountId` String?** (liga o lançamento
  gerado à conta fixa de origem — evita duplicar e permite editar/estornar).
- `FixedAccount`: **`isVariableAmount` Boolean @default(false)** (luz/água = valor que muda → nasce "a definir");
  `amountCents` continua sendo o valor fixo (ou 0/ignorado quando variável).

### Geração mensal das contas fixas
- Ao abrir o mês (ou via ação "gerar contas do mês"), para cada `FixedAccount` ativa que ainda não tem
  lançamento naquele mês (`fixedAccountId` + mês), criar um `Transaction` **`EM_ABERTO`**, `SAIDA`, Casa,
  categoria "Contas fixas", `dueDate` = dia do vencimento no mês, valor = `amountCents` (ou **a definir**
  quando `isVariableAmount`, com `estimatedCents` = o valor **pago no mês anterior** daquela conta).
- **Idempotente:** nunca gera duas vezes a mesma fixa no mesmo mês (chave `fixedAccountId`+mês).

### Marcar pago
- Ação "marcar pago": muda `status` → `PAGO`. Para as "a definir", o usuário **informa o valor real** nesse
  momento (vira `amountCents`); a `dueDate` permanece como referência. Pode também editar a data real.

### Cálculo (conserta a queixa, sem contagem dupla)
- **Gasto real / semanal / tetos por categoria** continuam olhando **só `status = PAGO`** (não mudam de
  comportamento — uma conta "em aberto" NÃO consome o teto da semana nem da categoria antes de ser paga).
  Os leitores atuais (`getTotalSpent`, `getWeeklySpending`, `getCategorySpending` e os gêmeos do planejamento)
  ganham um filtro `status = PAGO`. Como o default é `PAGO`, os lançamentos antigos entram normalmente.
- **Posso gastar ainda** = dinheiro do mês (entradas) − **comprometido**, onde
  **comprometido = Σ(SAIDA, PAGO).amountCents + Σ(SAIDA, EM_ABERTO).(amountCents, ou estimatedCents quando "a definir")**.
  São **duas agregações** (uma de pagos, uma de em aberto); a parcela em aberto escolhe por linha o valor
  real ou a estimativa. **Cada linha conta uma vez só** — a fixa em aberto é a MESMA linha que depois vira paga
  (muda o status, não cria outra), então não há contagem dupla na transição.

### Tela (upgrade da Casa, formato do mockup aprovado)
- **Hero:** "Posso gastar ainda R$ X" + barra de % comprometido + dinheiro do mês + chips (fixas / variável / já pago).
- **Contas fixas:** linhas com ícone, nome, vencimento, valor (ou "a definir" + estimativa), **pílula de status**
  (pago/em aberto) e ação "marcar pago".
- **Variável — esta semana:** teto (R$ 500) + barra do gasto; tetos por categoria.
- É a evolução da Visão Geral / Planejamento da Casa (não uma tela solta) — decidir no UI-phase onde cada bloco mora.

## 8. O que fica a critério do builder / a confirmar no planejamento

- Onde a geração mensal dispara (ao abrir o mês × botão explícito) e o texto/UX de "marcar pago" (valor das "a definir").
- Layout fino e em qual rota os blocos vivem (Visão Geral × Planejamento × nova aba "Mês").
- Nome exato do enum/campos e o índice (`fixedAccountId`+mês) pra idempotência.
- Como "a definir" sem mês anterior se comporta (estimativa = 0 / pedir valor).
- Receitas "a receber" da Casa (ex.: salário a cair) — incluir já ou só despesas nesta fase (default: foco em despesas).

## 9. Decisões já travadas com o Thaylan
- **Despesas avulsas também entram no "pago / em aberto".** O formulário de lançamento da Casa ganha o
  toggle **pago / em aberto** + **vencimento** (opcional); "marcar pago" é uma ação genérica (serve pra fixa
  gerada e pra avulsa). Cobre os itens avulsos do Notion (parcela, ingresso, revisão a pagar). Default = **pago**.
- Número de topo = **"posso gastar ainda"** (mockup aprovado).
- "A definir" (luz/água) usa **estimativa do mês passado** só pro cálculo de "posso gastar"; valor real na hora de pagar.
- Contas fixas **entram sozinhas como "em aberto"** todo mês.
- Tem que ser **visual** (não lista). Teto semanal de R$ 500 e tetos por categoria permanecem.

## 10. Decisões da revisão (chamadas minhas — confira ao ler)

- **R-1 (filtro de status):** só a conta do hero ("comprometido / posso gastar") soma `EM_ABERTO`; **todo o
  resto filtra `PAGO`** (gasto real, semanal, tetos). `EM_ABERTO` nesta fase só existe para contas fixas da Casa —
  as empresas (P&L/consolidado) não são afetadas (default `PAGO`, nada gera em aberto lá).
- **R-2 (fórmula):** `posso gastar = entradas − [Σ pagos + Σ em aberto(valor real ou estimativa)]` — duas
  agregações; a parcela em aberto escolhe por linha. Transição em aberto→pago é a mesma linha mudando de status.
- **R-3 (geração mensal):** o lançamento gerado tem `date = dueDate` (cai na janela do mês que os leitores já usam).
  A geração é uma **ação explícita** (Server Action — botão "gerar contas do mês" ou disparo intencional), **não**
  escrita durante render (evita corrida/duplicação). Idempotência: a ação checa se já existe linha
  (`fixedAccountId` + mês) antes de criar; nunca gera a mesma fixa duas vezes no mês.
- **R-4 (contas fixas hoje):** a tela `/contas-fixas` continua sendo o lugar de **definir** as fixas (agora com o
  toggle `isVariableAmount`). Apagar uma `FixedAccount` **não apaga** os lançamentos já gerados (preserva o
  histórico de caixa): a relação zera o `fixedAccountId` (SetNull), não deleta em cascata.
- **R-5 (estimativa "a definir"):** estimativa = valor **PAGO** do mês anterior daquela conta (busca por
  `fixedAccountId` + mês anterior + `PAGO`). Se o mês anterior ficou em aberto, usa a estimativa dele; se não há
  histórico, estimativa = 0 e a UI mostra "a definir" sem inflar o número (pode pedir o valor).

---

*Nada é construído até este documento ser aprovado. Depois da aprovação: UI-phase (contrato visual) → plano → execução, uma fatia por vez.*
