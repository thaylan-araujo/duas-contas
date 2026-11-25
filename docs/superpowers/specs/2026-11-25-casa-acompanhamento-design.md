# Design — Casa: Acompanhamento por categoria (remove planejamento semanal)

**Data:** 25/11/2026 · **Autor:** Thaylan + Claude
**Status:** proposto (aguardando aprovação)
**Relacionado:** Fase 3 (Planejamento, já construída), `spec.md` §3, `.planning/ROADMAP.md`

## Intenção e porquê

Trocar o **planejamento semanal manual** da Casa por um modelo de **acompanhamento** guiado pelos lançamentos do dia a dia. O planejamento atual (itens de plano amarrados a semanas + "Gastei R$" digitado por semana) **dá muito trabalho de manter**. O Thaylan lança as despesas diariamente e quer que o sistema **agrupe sozinho** o gasto real por semana e por categoria, com uma barra de "dinheiro do mês" e tetos mensais por categoria apenas como **referência** (sem travar nada).

## O modelo-alvo

```
DINHEIRO DO MÊS
R$ 8.500  ▸  [■■■■■■□□□□]  restam R$ 3.200
(valor definido manualmente no mês; diminui a cada despesa)

POR CATEGORIA (variáveis — teto mensal de referência)
Alimentação      R$ 900 / R$ 1.500   [■■■■■■□□□□]
Gasolina         R$ 320 / R$ 400     [■■■■■■■■□□]
Refeição livre   R$ 250 / R$ 300     [■■■■■■■■□□]

GASTOS POR SEMANA (automático, somado dos lançamentos reais)
Semana 1 (1–7)    Alimentação R$X · Gasolina R$Y …
Semana 2 (8–14)   …
```

- **Barra "Dinheiro do mês":** valor que o usuário **define manualmente** a cada mês (com base nas receitas lançadas, ex.: R$ 8.500). A barra começa nesse valor e **diminui a cada despesa** → mostra quanto resta.
- **Teto mensal por categoria variável** (Alimentação, gasolina, refeição livre…): mostra "gastei X de Y". É **referência**, não trava.
- **Semanal 100% automático:** gasto real agrupado por semana (1–7 / 8–14 / 15–21 / 22–fim) e por categoria, somado dos lançamentos. **Zero digitação.**
- **Lançamento diário:** já existe (CRUD de lançamentos da Fase 2); a data joga o gasto na semana certa.

## Objetivos

1. Registrar despesas no dia a dia → ver o **gasto semanal por categoria** calculado sozinho.
2. **Barra "dinheiro do mês"** (valor mensal definido pelo usuário) que esvazia conforme as despesas.
3. **Teto mensal por categoria variável** como referência (gastei X de Y), sem bloqueio.

## Não-objetivos / Removido

- **Itens de plano manuais** (valor por vez × nº de vezes × semanas).
- **Marcação de semanas** em cada item (campos week1..4 do `PlanItem`).
- **"Gastei R$ por semana" digitado** (`WeeklySpend` / override manual).
- **Os 4 cartões semanais** de planejado-vs-gastei.
- **Qualquer trava/bloqueio** — os tetos são só referência visual.

## Anti-objetivos

- Voltar a obrigar o usuário a manter um plano manual.
- Travar lançamento quando estourar um teto (é só referência).

## Restrições

- A **Fase 3 construiu** o planejamento semanal — isto **remove/retrabalha** parte dela (`PlanItem`, `WeeklySpend`, a tela `/planejamento`, e os cartões "Planejado/Folga" do dashboard).
- Reaproveitar `src/lib/weeks.ts` (faixas de semana) e `getWeeklySpending` para o agrupamento automático.
- pt-BR, dinheiro em centavos (Int). Migração com backup (os dados atuais de plano são só de teste).

## Decisões de arquitetura (minhas, a confirmar)

- **`MonthlyBudget`** passa a guardar o **"dinheiro do mês"** (valor mensal definido). A barra = dinheiro do mês − soma das despesas da Casa no mês. (Reaproveitar/renomear `ceilingCents`, a decidir no planejamento.)
- **Teto por categoria variável:** novo registro por (mês, categoria): limite mensal. Só categorias marcadas como "variáveis" têm teto.
- **Remover** os modelos `PlanItem` e `WeeklySpend` (migração com backup).
- **Agrupamento semanal** = derivado dos `Transaction` da Casa via `weeks.ts` (nada persistido/manual).
- **Dashboard:** os cartões "Planejado/Folga" viram "Dinheiro do mês / Restante" (a definir no planejamento).

## O que fica para o planejamento

- Destino exato do `MonthlyBudget.ceilingCents` (reusar como "dinheiro do mês" ou novo campo).
- Como marcar uma categoria como "variável" (flag na categoria, ou toda categoria da Casa pode ter teto).
- Layout exato da tela nova e dos cartões do dashboard.
- Requisitos PLAN-01..06 retrabalhados no `spec.md`: remover o cartão semanal manual (PLAN-04), reescrever PLAN-02/03; novos itens para a barra do mês e os tetos por categoria.
