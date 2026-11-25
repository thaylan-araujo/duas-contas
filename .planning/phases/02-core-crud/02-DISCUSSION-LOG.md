# Phase 2: Core CRUD - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-23
**Phase:** 02-core-crud
**Areas discussed:** Dashboard sem teto/planejado, Linkagem dos pares de pró-labore, Editar e excluir categorias (LANC-06)

---

## Dashboard sem teto/planejado

**Questão 1: O que o dashboard da Casa mostra em Fase 2 para 'teto' e 'planejado'?**

| Option | Description | Selected |
|--------|-------------|----------|
| Só 'Gasto até hoje' + barras + gráfico | Oculta os cartões de teto/planejado/folga nesta fase. Fase 3 os adiciona. | |
| 4 cartões, teto/planejado/folga em '--' | Mostra os 4 cartões desde já, teto e planejado exibem '--' até a Fase 3. | |
| Adicionar 'teto do mês' simples ao schema | Adicionar MonthlyBudget {teto, mês} ao Prisma agora. | ✓ |

**User's choice:** Adicionar teto simples (Recomendado)
**Notes:** Usuário pediu recomendação antes de decidir. Recomendei adicionar MonthlyBudget para que o dashboard já seja funcional na Fase 2 com teto + folga reais.

---

**Questão 2: Como o usuário define ou edita o teto do mês no dashboard?**

| Option | Description | Selected |
|--------|-------------|----------|
| Campo editável inline no próprio cartão | Clica no valor do cartão 'Teto' e edita in-place. Sem página extra. | ✓ |
| Botão 'Definir teto' no dashboard | Botão fixo perto dos cartões que abre um dialog com campo de valor. | |
| Padrão fixo R$ 3.000, sem edição na Fase 2 | Hardcode R$ 3.000 sem UI de edição por agora. | |

**User's choice:** Campo editável inline no próprio cartão
**Notes:** Preferência por edição in-place sem friction adicional.

---

**Questão 3: Quando o mês muda, o teto do novo mês começa do zero ou copia do mês anterior?**

| Option | Description | Selected |
|--------|-------------|----------|
| Copia o teto do mês anterior automaticamente | Se o teto de novembro era R$ 3.000, dezembro já começa com R$ 3.000. | ✓ |
| Começa do zero, usuário define toda vez | Novo mês mostra teto em branco até o usuário preencher. | |

**User's choice:** Copia o teto do mês anterior automaticamente
**Notes:** Comportamento mais ergonômico — o teto raramente muda.

---

## Linkagem dos pares de pró-labore

**Questão 1: Como identificar o par de lançamentos de um pró-labore?**

| Option | Description | Selected |
|--------|-------------|----------|
| Adicionar campo pairId ao schema | Adicionar `pairId: String?` ao modelo Transaction. Os dois lançamentos do par recebem o mesmo UUID. | ✓ |
| Usar o campo origin já existente | Usar `origin` como link (ex: 'prolabore-{uuid}'). Sem mudança no schema. | |

**User's choice:** Adicionar campo pairId ao schema (Recomendado)
**Notes:** Preferência pela solução mais explícita e autoexplicativa.

---

**Questão 2: Se o usuário tentar editar um lançamento que faz parte de um pró-labore, o que acontece?**

| Option | Description | Selected |
|--------|-------------|----------|
| Bloquear edição de lançamentos do par | Sheet de edição exibe aviso e campos ficam somente leitura. | ✓ |
| Permite editar, mas propaga o valor ao par | Editar um lançamento do par atualiza o outro automaticamente. | |
| Permite editar livremente | Editar um lançamento do par não afeta o outro. | |

**User's choice:** Sim, bloquear edição (Recomendado)
**Notes:** Usuário pediu recomendação. Recomendei bloquear para manter consistência dos dados (os dois lançamentos sempre com mesmo valor e data). Para mudar, o usuário exclui o par e cria um novo.

---

## Editar e excluir categorias (LANC-06)

**Questão 1: Onde o usuário edita e exclui suas categorias?**

| Option | Description | Selected |
|--------|-------------|----------|
| Seção 'Gerenciar categorias' na página de Lançamentos | Link discreto que abre um Sheet com lista de categorias: nome + ícones de editar e excluir. | ✓ |
| Inline no Select de categoria do formulário | Ícone de lápis/lixeira ao lado de cada categoria no dropdown. | |
| Fase 2 só implementa 'criar', editar/excluir ficam para a Fase 3 | LANC-06 cobre criar na Fase 2. Editar e excluir são implementados depois. | |

**User's choice:** Seção 'Gerenciar categorias' na página de Lançamentos (Recomendado)
**Notes:** Preferência por uma área dedicada acessível da página de lançamentos, sem poluir o formulário.

---

**Questão 2: Uma categoria só pode ser excluída se não tiver lançamentos vinculados?**

| Option | Description | Selected |
|--------|-------------|----------|
| Bloquear exclusão se houver lançamentos | Sistema mostra aviso 'Esta categoria tem X lançamentos e não pode ser excluída.' | ✓ |
| Permitir excluir e reatribuir para 'Outros' | Sistema move todos os lançamentos da categoria para 'Outros' e exclui a categoria. | |

**User's choice:** Bloquear exclusão se houver lançamentos (Recomendado)
**Notes:** Preferência pela abordagem mais simples e segura para preservar o histórico.

---

## Claude's Discretion

- Estrutura exata da Server Action de upsert do MonthlyBudget (usar `upsert` nativo do Prisma)
- Como renderizar o campo inline do teto no cartão do dashboard (input controlado com `onBlur`)
- Organização interna do Sheet "Gerenciar categorias" (tabs por conta ou lista única com filtro)
- Lógica de cópia automática do teto do mês anterior

## Deferred Ideas

- **Dashboard da Empresa** — DASH-03, DASH-04 ficam para a Fase 5
- **Lançamento rápido mobile (LANC-07)** — fora do escopo da Fase 2
- **"Total planejado" no dashboard** — exibe "--" até a Fase 3
- **Editar itens de planejamento via dashboard** — apenas teto editável na Fase 2
