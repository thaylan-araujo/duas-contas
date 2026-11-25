# Phase 3: Planning - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-25
**Phase:** 3-Planning
**Areas discussed:** Itens × semanas, Origem do "Gastei R$", Plano inicial, Gasto anual vs Meta

---

## Itens × semanas

| Option | Description | Selected |
|--------|-------------|----------|
| Marcar as semanas no item | Marca explicitamente em quais das 4 semanas o item cai; nº de vezes = semanas marcadas | ✓ |
| Só nº de repetições, distribuir sozinho | Informa "quantas vezes" e o sistema espalha pelas semanas | |
| Valor único no mês, sem semana | Item só entra no total do mês, sem dividir por semana | |

**User's choice:** Marcar as semanas no item.
**Notes:** "Valor por vez" = valor de cada ocorrência; total do item = valor por vez × nº de semanas marcadas (confirmado pelo spec §Cálculos).

---

## Origem do "Gastei R$"

| Option | Description | Selected |
|--------|-------------|----------|
| Automático + ajustável à mão | Soma lançamentos reais da categoria/semana e preenche; permite sobrescrever | ✓ |
| Só automático | Sempre calculado dos lançamentos; sem digitação manual | |
| Só manual | Usuário digita; não puxa dos lançamentos | |

**User's choice:** Automático + ajustável à mão.
**Notes:** Grupo do item do plano reaproveita as Categorias da Casa existentes para casar com os lançamentos reais no cálculo automático.

---

## Plano inicial

| Option | Description | Selected |
|--------|-------------|----------|
| Pré-preenchido com a rotina do spec | Primeiro mês já vem com os itens do spec; meses seguintes usam "copiar mês anterior" | ✓ |
| Botão "usar meu plano padrão" | Começa vazio, com botão para inserir a rotina do spec | |
| Começa vazio | Nenhum item; usuário cadastra do zero | |

**User's choice:** Pré-preenchido com a rotina do spec.
**Notes:** Primeiro mês pré-preenchido; meses seguintes vazios + botão "Copiar plano do mês anterior" (PLAN-05).

---

## Gasto anual vs Meta

| Option | Description | Selected |
|--------|-------------|----------|
| Entidades separadas | Gasto anual (÷12) e Meta (progresso/prazo) distintos | ✓ |
| Unificar: gasto anual vira meta | Gasto anual cria caixinha/meta automaticamente | |

**User's choice:** Entidades separadas.
**Notes:** Metas pré-cadastradas (META-02) "Reserva de emergência" e "Caixinha do carro" vêm só com o nome; valores/prazo em branco para o usuário preencher.

---

## Claude's Discretion

- Estrutura e nomes exatos dos novos modelos Prisma (item do plano, FixedAccount, AnnualExpense, Goal).
- Persistência do override manual do "Gastei".
- Layout das telas (seguir PDF de design / UI-SPEC).
- Como o cartão "Planejado" do dashboard passa a somar os itens do mês.
- Lógica de pré-preenchimento do primeiro mês.

## Deferred Ideas

Levantadas pelo usuário; fogem do spec/roadmap atual (decisão: "Fase 3 só Casa + guardar o resto"):

- **Família multiusuário + gastos por pessoa** (Thaylan / Ligiane) com barra de restante por pessoa.
- **Múltiplas empresas (3): Elite Juris, Infoproduto, Achadinhos** — negócios distintos com faturamento/metas/investimento próprios (hoje o spec modela 1 Empresa de afiliados com canais).
- **Reserva de emergência / metas para a Empresa.**
- **Projeção de "quanto vai sobrar" pessoal/família.**
