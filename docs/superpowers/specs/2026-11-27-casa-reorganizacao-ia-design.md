# Design — Reorganização da Casa (Visão Geral só-leitura; editar em Lançamentos)

**Data:** 27/11/2026
**Status:** Aprovado (estrutura confirmada pelo Thaylan)
**Fase:** 11 (roadmap)

---

## 1. Intenção e o porquê

Hoje a **Visão Geral** da Casa virou um painel de edição (botões "gerar contas do mês", "marcar
pago", editar teto inline…), e as coisas da Casa estão espalhadas (Visão Geral, Lançamentos,
Planejamento, "Contas fixas e metas"). O Thaylan quer **separar claramente ver de editar**: a Visão
Geral é só pra **bater o olho e entender o mês**; **toda edição mora em Lançamentos** (inclusive as
contas fixas); e **Metas** fica como o lugar de metas/reservas. É pré-requisito pra usar o app 100% em
dezembro sem confusão de "onde eu mexo em quê".

## 2. Objetivos

- **Visão Geral = só leitura.** Nenhum botão de editar/marcar/gerar. Mostra: "posso gastar ainda",
  resumo das contas fixas (pago/em aberto), variável da semana + tetos (acompanhamento), renda familiar, gráficos.
- **Lançamentos = onde se edita tudo**, em abas:
  - **Lançamentos**: a lista + criar/editar/excluir (avulsos).
  - **Contas fixas**: cadastrar fixas, **gerar o mês**, **marcar pago**, valor variável.
  - Definir **tetos por categoria** e gerenciar categorias moram aqui também.
- **Metas = item próprio** no menu (metas e reservas), separado das contas fixas.
- **"Planejamento" deixa de ser item de menu**: o *acompanhar* (gastei X de Y) vira leitura na Visão
  Geral; o *definir tetos* vai pra Lançamentos.
- Menu da Casa passa de 4 itens misturados para **3 claros: Visão Geral · Lançamentos · Metas**.

## 3. Não-objetivos

- Não muda **regra de negócio** nem o banco (sem migração): é só **mover componentes + reorganizar o menu + tornar a Visão Geral só-leitura**.
- Não mexe no contexto de **empresa** (Canais/Consolidado/Dívidas) além de ajustar o menu se necessário.
- Não altera o cálculo "posso gastar" (Fase 10) — só muda onde cada bloco aparece.
- Não é o redesign visual "mais bonito" (isso é outra conversa, adiada).

## 4. Anti-objetivos

- Deixar **ação de editar na Visão Geral** (qualquer botão que muda dado).
- **Perder funcionalidade** da Fase 10 ao mover (gerar/marcar pago/valor variável/tetos) — tudo continua existindo, só muda de lugar.
- Quebrar a navegação por contexto (Casa × empresa) já existente (ContaSelector, Sidebar/BottomNav).

## 5. Restrições

- Reaproveitar os componentes que já existem (HeroPossoGastar, ContasFixasBloco, acompanhamento semanal,
  tetos por categoria, metas, gerar/marcar pago, TransactionSheet). O trabalho é **mover/compor + tornar leitura**, não reescrever.
- pt-BR; R$/datas via `src/lib/format.ts`; mobile-first; botões ≥44px.
- Navegação: Sidebar + BottomNav (itens por contexto); abas dentro de Lançamentos devem funcionar no mobile.

## 6. Desenho decidido (estrutura)

### Menu da Casa (novo)
1. **Visão Geral** (só-leitura) — Hero "posso gastar"; **resumo** de contas fixas (lista read-only com
   pílula de status, sem botões); **variável da semana + tetos** (acompanhamento, read-only); renda familiar; gráficos.
2. **Lançamentos** (editar) — abas:
   - **Lançamentos** — lista + criar/editar/excluir (o `TransactionSheet` atual, já com status/vencimento).
   - **Contas fixas** — o que hoje está em `/contas-fixas` (CRUD de FixedAccount, `isVariableAmount`) + **gerar o mês** + **marcar pago** (migra o `ContasFixasBloco` interativo pra cá).
   - **Tetos & categorias** — definir tetos por categoria (o "editar" do antigo Planejamento) + gerenciar categorias.
3. **Metas** (editar) — o bloco de metas/reservas (hoje dentro de "Contas fixas e metas").

### O que move
- `ContasFixasBloco` (com os botões "gerar"/"marcar pago") → de Visão Geral **para a aba Contas fixas de Lançamentos**.
  Na Visão Geral fica uma **versão só-leitura** (mesmo visual, sem botões).
- Editor inline do "dinheiro do mês"/tetos → sai da Visão Geral; definir tetos vai pra Lançamentos.
- Página `/contas-fixas` e `/planejamento` como itens de menu → removidas do menu; seu conteúdo realocado
  (contas fixas + tetos → Lançamentos; metas → Metas; acompanhamento → Visão Geral só-leitura).
- Itens de menu (Sidebar/BottomNav) atualizados: Casa = Visão Geral · Lançamentos · Metas.

## 7. O que fica a critério do builder
- Implementação das **abas** em Lançamentos (componente de tabs shadcn já no projeto) e rota (query param `?aba=` × sub-rotas).
- Se "Tetos & categorias" é uma 3ª aba ou uma seção dentro de "Contas fixas"/"Lançamentos".
- Como as rotas antigas (`/planejamento`, `/contas-fixas`) passam a redirecionar ou viram sub-rotas de `/lancamentos`.
- Onde exatamente "Metas" vive (rota própria `/metas`).
- Qual a versão só-leitura de cada bloco (esconder botões × componente separado).

## 8. Decisões travadas com o Thaylan
- Visão Geral **sem edição**; editar em **Lançamentos**; **contas fixas em Lançamentos**; **Metas** = metas/reservas.
- "Planejamento" **some** como item; acompanhamento → Visão Geral (ver), tetos → Lançamentos (editar).
- Contas fixas = **aba dentro de Lançamentos** (recomendação aceita).

---

*Nada é construído até este documento ser aprovado. Depois: UI-phase (navegação/abas) → plano → execução, uma fatia por vez. Sem migração de banco.*
