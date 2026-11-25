---
phase: 3
slug: planning
status: approved
shadcn_initialized: true
preset: "shadcn style default (Radix UI) — herdado da Fase 1/2"
created: 2026-11-25
reviewed_at: 2026-11-25
---

# Phase 3 — UI Design Contract: Planejamento e Semanas da Casa

> Contrato visual e de interação para o planejamento mensal da Casa: tabela de itens do plano,
> resumo (teto × planejado × folga + barra por grupo), os 4 cartões semanais com "Gastei R$",
> contas fixas, gastos anuais ÷12 e metas de poupança com barra de progresso.
> Gerado por gsd-ui-researcher. Verificado por gsd-ui-checker.
> Requisitos cobertos: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, FIXA-01, FIXA-02, META-01, META-02.

**Reaproveita integralmente** o contrato visual da Fase 2 (`02-UI-SPEC.md`): tokens de cor, tipografia,
espaçamento, padrões de Sheet/Dialog/Card, regra `min-h-[44px]`, `formatBRL()` + `font-mono` para valores,
`formatDate()` + `font-sans` para datas, `mesSelecionado`/`contaAtiva` via Zustand. Este documento especifica
**apenas o que a Fase 3 adiciona**; onde um padrão já foi fixado na Fase 2, apenas o referenciamos.

---

## Design System

| Propriedade | Valor |
|-------------|-------|
| Ferramenta | shadcn/ui (style "default", `components.json` já presente) |
| Preset | estilo "default" — herdado das Fases 1/2 (não reinicializar) |
| Biblioteca de componentes | Radix UI (via shadcn) |
| Biblioteca de ícones | lucide-react |
| Fonte da interface | Manrope via `--font-sans` |
| Fonte dos números | IBM Plex Mono via `--font-mono` |

**Fonte:** `components.json` + `globals.css` + `02-UI-SPEC.md`.

**Componentes shadcn já instalados (Fases 1–2):** Button, Input, Label, Card, Separator, Sheet, Skeleton, Dialog, Select, Badge, Tabs.

**Novos componentes shadcn necessários nesta fase:**
- `Checkbox` — marcar em quais das 4 semanas o item do plano cai (D-01)
- `Switch` — flag de "débito automático" da conta fixa (FIXA-01)
- `Progress` — barra de progresso das metas de poupança (META-01); também reutilizável na barra por grupo (PLAN-03) se preferível ao `<div>` manual da Fase 2
- `Table` — tabela de itens do plano (PLAN-02) no desktop; no mobile a tabela vira cartões-lista (ver Responsive)

> Todos os quatro são do registry oficial shadcn — sem gate de terceiros. A barra "por grupo" e a barra
> de progresso de meta PODEM reutilizar o padrão de barra manual já usado no dashboard da Fase 2
> (`h-2 rounded-full bg-border` + preenchimento `bg-casa`) em vez de `Progress`, a critério do executor —
> ambas as abordagens estão dentro do contrato.

---

## Spacing Scale

Escala de 4 pontos. Herdada da Fase 2 sem alterações. Fonte: `spec.md §Visual` + padrão shadcn/ui.

| Token | Valor | Uso nesta fase |
|-------|-------|----------------|
| xs | 4px | Gap entre checkbox de semana e seu label; gap ícone↔texto inline |
| sm | 8px | Padding de Badge/pill de grupo; gap entre label e campo; gap entre célula de valor e "restante" |
| md | 16px | Padding interno de Card (cartões semanais, cartões de meta); espaçamento entre campos do Sheet |
| lg | 24px | Padding horizontal de Sheet/Dialog; gap entre as seções (plano / contas fixas / gastos anuais / metas) |
| xl | 32px | Gap entre a grade dos 4 cartões semanais e o bloco de resumo |
| 2xl | 48px | Separador entre header da página e conteúdo |
| 3xl | 64px | Não usado nesta fase |

**Exceções:**
- Todos os botões, campos, `Checkbox` e `Switch` interativos: alvo de toque `min-h-[44px]` / área clicável ≥ 44px (regra inviolável do spec). O trilho visual do `Switch` pode ser menor, mas o alvo de toque deve ser envelopado para 44px.
- Campo "Gastei R$" inline nos cartões semanais: `min-h-[44px]` como qualquer input.
- Espaço seguro inferior do BottomNav: `env(safe-area-inset-bottom)` (já implementado na Fase 1).

---

## Typography

Herdada da Fase 2 sem alterações. Fonte: `spec.md §Visual` + `globals.css` + `02-UI-SPEC.md`.

| Papel | Tamanho | Peso | Line-height | Fonte | Uso nesta fase |
|-------|---------|------|-------------|-------|----------------|
| Display (valor monetário) | 24px (`text-2xl`) | 600 (semibold) | 1.2 | IBM Plex Mono (`font-mono`) | Total planejado, folga, total da semana, "guardar por mês" em destaque |
| Heading de seção | 20px (`text-xl`) | 600 (semibold) | 1.2 | Manrope (`font-sans`) | Títulos "Plano do mês", "Semana 1–4", "Contas fixas", "Gastos do ano", "Metas"; títulos de Sheet |
| Body | 16px (`text-base`) | 400 (regular) | 1.5 | Manrope (`font-sans`) | Nome do item do plano, nome da conta fixa/meta, labels de campo |
| Label / Metadado / Valor inline | 14px (`text-sm`) | 400 (regular) | 1.4 | Manrope / IBM Plex Mono | Grupo do item, "× N vezes", valor por vez, restante por item, "venc. dia X", "guardar por mês", % do teto |

> **12px (`text-xs`)** — reservado a pills de grupo/conta e a rótulos de eixo de gráfico, reutilizando as
> classes já em uso. Não redeclarar aqui.

**Pesos em uso nesta fase: 400 (regular) e 600 (semibold) — máximo 2 pesos.**

**Regras herdadas:** toda string formatada por `formatBRL()` usa `font-mono`; datas/"dia de vencimento"
exibidas como número usam `font-mono text-sm`; rótulos textuais usam `font-sans`.

---

## Color

Herdada da Fase 2. **Nenhuma cor nova é introduzida nesta fase.** Fonte: `globals.css` + `spec.md §Visual`.

| Papel | Hex | Token CSS | Uso nesta fase |
|-------|-----|-----------|----------------|
| Dominante (60%) | `#F3F5F7` | `bg-bg` | Fundo da página, fundo dos campos, trilho de barras (quando não usar `bg-border`) |
| Secundário (30%) | `#FFFFFF` | `bg-card` | Cartões semanais, cartões de meta, cartões de conta fixa/gasto anual, Sheet, linhas de tabela |
| Borda / trilho de barra | `#E3E7EC` | `border-border` / `bg-border` | Bordas de cartão, dividers de tabela, trilho não preenchido das barras |
| Texto principal | `#0F1B2D` | `text-text-primary` | Nome do item/conta/meta, valores neutros, total planejado |
| Texto secundário | `#5B6675` | `text-text-secondary` | Grupo, "× N vezes", "venc. dia X", "guardar por mês" (label), placeholder |
| Acento Casa | `#1D4ED8` | `text-casa` / `bg-casa` | Ver "Acento reservado para" abaixo |
| Fundo claro Casa | `#DCEBFF` | `bg-casa-light` | Ver "Acento reservado para" abaixo |
| Acento Empresa | `#B45309` | `text-empresa` / `bg-empresa` | **Não usado nesta fase** (Fase 3 é 100% Casa). Mantido no token set para consistência. |
| Positivo (folga/sobra) | `#0F766E` | `text-positive` | Folga positiva (teto − planejado ≥ 0); restante da semana/item quando ≥ 0; meta concluída |
| Atenção (passou do teto) | `#8A3A06` | `text-warning` | Folga negativa ("Passou do teto em R$ X"); restante negativo (gastou mais que o planejado) |
| Destrutivo | `#DC2626` | Tailwind `red-600` | Botão "Excluir" nos Dialogs de exclusão de item/conta fixa/gasto anual/meta |

**Acento Casa (`#1D4ED8` / `#DCEBFF`) reservado para (split 10%):**
1. Preenchimento da barra "por grupo" do resumo do plano (PLAN-03) e da barra de progresso das metas (META-01): `bg-casa`.
2. Cabeçalho/realce do cartão da semana atual (a semana que contém a data de hoje): borda ou faixa `bg-casa-light text-casa`.
3. Estado ativo de itens Casa na Sidebar (já implementado na Fase 1).
4. Botão primário "Novo item do plano" / "Nova conta fixa" / "Nova meta" quando usar variante de acento (opcional; a variante `default` do shadcn também é aceita).

**Regra de split 60/30/10 (herdada):** Fundo + campos (60%) → cartões brancos + Sheets (30%) →
acento Casa + positivo/warning (10%). Nunca aplicar `text-casa` a texto de corpo corrido; apenas a
barras, realce da semana atual e estados ativos. `text-empresa` não aparece nesta fase.

---

## Componentes desta Fase

### 1. Tela "Planejamento e semanas" (`/planejamento`)

Substitui o stub "em breve". Server Component que carrega o plano do `mesSelecionado` (Zustand) da Casa.
Estrutura vertical: **(A) Cabeçalho + teto** → **(B) Tabela do plano** → **(C) Resumo** → **(D) 4 cartões semanais**.

#### A. Cabeçalho da página + teto do mês (PLAN-01)

- Título: "Planejamento" (`text-xl font-semibold text-text-primary`).
- Seletor de mês: componente `mesSelecionado` já existente (botões `<` mês `>`), reutilizado.
- **Teto do mês:** edição inline reutilizando o padrão de edição inline da Fase 2 (não abrir Sheet só para o teto).
  - Exibição: "Teto do mês" (label `text-sm text-text-secondary`) + valor `R$ X.XXX,XX` (`font-mono text-2xl font-semibold`).
  - Ao tocar, vira `Input inputMode="decimal"` com `min-h-[44px]`; confirma com Enter/blur via Server Action → `revalidatePath`.
  - Padrão R$ 3.000,00 quando o mês não tem teto (`MonthlyBudget` já auto-copia do mês anterior — D-04 Fase 2).
- Botão "Copiar plano do mês anterior" (PLAN-05): `Button` variante `outline`, `min-h-[44px]`, ícone `Copy` 16px. Visível sempre que houver um mês anterior com itens; desabilitado (não removido) se não houver, com tooltip "Nenhum plano no mês anterior.".

#### B. Tabela de itens do plano (PLAN-02, D-01, D-03)

**Desktop (≥ lg):** `Table` do shadcn. **Mobile (< lg):** cada item vira um cartão-lista (mesmo padrão da lista de lançamentos da Fase 2).

Colunas / campos por item:

| Coluna | Conteúdo | Formatação |
|--------|----------|------------|
| Nome | Texto livre (ex.: "Compra do mês", "Mercado") | `font-sans text-base text-text-primary` |
| Grupo | Categoria da Casa existente (D-03), exibida como pill | pill `text-xs rounded-full px-2 py-0.5 bg-casa-light text-casa` |
| Valor por vez | `R$ X,XX` | `font-mono text-sm` |
| Semanas (1–4) | 4 `Checkbox` lado a lado, rotulados "1" "2" "3" "4" | nº de marcadas = nº de vezes (D-01) |
| Total do item | valor por vez × nº semanas marcadas | `font-mono text-sm font-semibold text-text-primary` (calculado, somente leitura) |
| % do teto | total do item ÷ teto × 100 | `font-mono text-xs text-text-secondary` |
| Ações | ícone `Pencil` (editar) + `Trash2` (excluir) 16px | `Trash2` em `text-red-600` |

- **Edição do item:** abre `Sheet` (`side="bottom"` mobile / `side="right"` w-[420px] desktop) com os campos Nome, Grupo (`Select` de categorias da Casa — reutiliza o Select de categoria da Fase 2, incluindo "+ Nova categoria…"), Valor por vez (`Input inputMode="decimal"`, preview `R$` formatado), e os 4 `Checkbox` de semana. Mesmo Sheet para criação e edição.
- **Itens de Contas fixas (PLAN-06, D-05):** linhas do grupo "Contas fixas" entram automaticamente a partir das contas fixas cadastradas. Essas linhas são **somente leitura** na tabela do plano (não editáveis/excluíveis aqui) e exibem um ícone `Lock` 14px `text-text-secondary` com tooltip "Vem das Contas fixas — edite na seção Contas fixas." para explicar por que não têm ações.
- **Primeiro mês (D-04):** quando o mês não tem plano nem histórico anterior, a tabela vem pré-preenchida com a rotina do spec (Compra do mês R$ 1.000 ×1 sem. 1; Mercado R$ 250 ×3 sem. 2–4; Combustível R$ 100 ×4; Lazer R$ 150 ×4; Outros R$ 0). Meses seguintes começam vazios (ver estado vazio).

#### C. Resumo do plano (PLAN-03)

Card branco `rounded-2xl border border-border p-6` com três números e a barra por grupo:

- "Total planejado" — soma dos totais de item — `font-mono text-2xl font-semibold text-text-primary`.
- "Folga" — teto − total planejado — `text-positive` se ≥ 0, `text-warning` se < 0; quando negativa, exibir "Passou do teto em R$ [valor]" (copy do spec §Cálculos).
- Barra por grupo: uma linha por grupo (categoria) com itens, agregando os totais. Estrutura por linha: `[nome do grupo] [barra] [R$ total do grupo] [% do teto]`.
  - Barra: trilho `h-2 rounded-full bg-border`; preenchimento `bg-casa` proporcional ao % do teto.
  - Nome do grupo: `text-sm text-text-primary`. Valor: `font-mono text-sm text-text-secondary`.
- Sem itens: "Nenhum item planejado para este mês." (ver estado vazio).

#### D. Cartões semanais (PLAN-04, D-01, D-02)

Grade de 4 cartões (`Card` branco `rounded-2xl border border-border p-4`). Mobile: coluna única empilhada. Desktop: grade 2×2 (ou 4 colunas em telas largas).

Semanas fixas (spec §Cálculos, não configuráveis): Sem 1 = dias 1–7, Sem 2 = 8–14, Sem 3 = 15–21, Sem 4 = 22–fim do mês.

**Anatomia de cada cartão:**
- Cabeçalho: "Semana N" (`text-xl font-semibold`) + faixa de dias "dias X–Y" (`text-sm text-text-secondary`). O cartão da **semana atual** (contém a data de hoje) recebe realce `bg-casa-light` no cabeçalho + `text-casa` no título.
- Lista de itens que caem naquela semana (item marcado para a semana N em D-01). Cada linha:
  - Nome do item (`text-base`) + "planejado R$ X,XX" (`font-mono text-sm text-text-secondary`).
  - Campo **"Gastei R$"** (D-02): `Input inputMode="decimal"` inline, `min-h-[44px]`, preview `R$` formatado.
    - Valor exibido por padrão = **soma automática** dos `Transaction` da Casa da mesma categoria com `date` dentro da faixa da semana (D-02). Exibido em `font-mono`.
    - O usuário pode **sobrescrever manualmente**; o override persiste (campo opcional). Quando houver override, exibir ícone `Pencil` 12px `text-casa` ao lado com tooltip "Valor digitado manualmente — toque em Recalcular para voltar ao automático.".
    - Micro-ação "Recalcular" (link `text-sm text-casa`) limpa o override e volta à soma automática.
  - "Restante R$ Y,YY" por item = planejado − gastei: `font-mono text-sm`, `text-positive` se ≥ 0, `text-warning` se < 0.
- Rodapé do cartão: "Total da semana" (planejado) e "Restante da semana" (= planejado da semana − gastei da semana), ambos `font-mono`, restante com a mesma regra positivo/warning.
- Cartão de semana sem itens: corpo "Nada planejado nesta semana." (`text-sm text-text-secondary`), centralizado.

### 2. Dashboard da Casa — integração do cartão "Planejado" (`/visao-geral`)

- O cartão "Planejado" do dashboard da Casa (hoje mostra `--` — ver `visao-geral/_components`) passa a exibir o **total planejado do mês** (soma dos totais de item do `mesSelecionado`). Formatação idêntica aos demais cartões: `font-mono text-2xl font-semibold text-text-primary`.
- O cartão "Folga" passa a usar o total planejado real (teto − planejado), com a regra de cor positivo/warning já definida na Fase 2.
- Nenhuma mudança de layout no dashboard; apenas troca da fonte de dados de `--` para o valor calculado. Sem plano no mês: manter `--` nos cartões de Planejado/Folga (fallback já existente).

### 3. Tela "Contas fixas, gastos do ano e metas" (`/contas-fixas`)

Substitui o stub "em breve". Server Component. Três seções empilhadas, separadas por `Separator` + gap `lg (24px)`: **Contas fixas** → **Gastos do ano** → **Metas**.

#### 3.1 Contas fixas (FIXA-01, D-05)

- Título de seção "Contas fixas" + botão "Nova conta fixa" (`Button` default, `min-h-[44px]`, ícone `Plus` 16px).
- Lista de cartões-lista, uma conta fixa por linha:
  - Nome (`text-base`) + "venc. dia X" (`font-mono text-sm text-text-secondary`).
  - Valor `R$ X,XX` (`font-mono text-sm font-semibold`).
  - Pill "Débito automático" quando a flag estiver ligada: `text-xs rounded-full px-2 py-0.5 bg-casa-light text-casa`; ausente quando desligada.
  - Ações: `Pencil` + `Trash2` 16px.
- **Sheet de criação/edição:** campos Nome (`Input`), Dia de vencimento (`Input type="number"` 1–31, `min-h-[44px]`), Valor (`Input inputMode="decimal"`), e **Switch** "Débito automático" (sim/não) com label à esquerda e `Switch` à direita, alvo de toque ≥ 44px.
- Nota contextual abaixo do título: "As contas fixas entram sozinhas no plano do mês, no grupo Contas fixas." (`text-sm text-text-secondary`) — explica a automação PLAN-06/D-05.

#### 3.2 Gastos do ano (FIXA-02, D-05)

- Título "Gastos do ano" + botão "Novo gasto anual".
- Lista de cartões-lista, um gasto anual por linha:
  - Nome (`text-base`) + "vence em [mês]" (`text-sm text-text-secondary`).
  - Valor no ano `R$ X,XX` (`font-mono text-sm`).
  - **"Guardar por mês R$ Z,ZZ"** = valor no ano ÷ 12 (D-05): `font-mono text-sm text-casa`, com label "guardar por mês" em `text-xs text-text-secondary`. É **somente exibição** — não vira meta (D-05).
  - Ações: `Pencil` + `Trash2`.
- **Sheet:** Nome, Valor no ano (`inputMode="decimal"`), Mês de vencimento (`Select` jan–dez em pt-BR).

#### 3.3 Metas de poupança (META-01, META-02, D-06)

- Título "Metas" + botão "Nova meta".
- Um `Card` branco por meta (`rounded-2xl border border-border p-4`):
  - Nome da meta (`text-xl font-semibold`).
  - Barra de progresso: `Progress` (ou barra manual `h-2 rounded-full bg-border` + `bg-casa`) = guardado ÷ valor-alvo. `aria-valuenow`/`aria-valuemax` presentes.
  - Linha de valores: "Guardado R$ A,AA de R$ B,BB" (`font-mono text-sm`) + "C%" (`font-mono text-sm font-semibold text-casa`).
  - "Guardar por mês R$ D,DD" = (meta − guardado) ÷ meses até o prazo (D-06, spec §Cálculos): `font-mono text-sm text-casa` com label "guardar por mês". Se o prazo estiver vazio, exibir "—" e o label "defina um prazo para calcular".
  - Prazo: "até mm/aaaa" (`font-mono text-sm text-text-secondary`), ou "sem prazo" quando vazio.
  - Meta atingida (guardado ≥ alvo): barra cheia em `bg-positive`, badge "Concluída" `text-xs bg-positive/10 text-positive`.
  - Ações: `Pencil` + `Trash2`.
- **Seed (META-02, D-06):** duas metas pré-cadastradas **apenas com o nome** — "Reserva de emergência" e "Caixinha do carro" — com valor-alvo, guardado e prazo em branco/zerados. Elas aparecem com barra 0%, "guardar por mês" = "—" e o label "defina um prazo para calcular", convidando o usuário a preencher.
- **Sheet:** Nome, Valor da meta (`inputMode="decimal"`), Valor guardado (`inputMode="decimal"`), Prazo (`Input type="month"` → mm/aaaa).

---

## Copywriting Contract

Todos os textos em Português do Brasil. CTAs são verbo + substantivo; mensagens de erro descrevem o problema e o próximo passo.

| Elemento | Texto |
|----------|-------|
| Título tela planejamento | "Planejamento" |
| Label teto do mês | "Teto do mês" |
| CTA copiar plano | "Copiar plano do mês anterior" |
| Tooltip copiar plano desabilitado | "Nenhum plano no mês anterior." |
| CTA novo item do plano | "Novo item do plano" |
| Título Sheet item — criação | "Novo item do plano" |
| Título Sheet item — edição | "Editar item do plano" |
| Label campo Nome (item) | "Nome" |
| Label campo Grupo | "Grupo" |
| Label campo Valor por vez | "Valor por vez" |
| Label campo Semanas | "Em quais semanas?" |
| Labels das semanas (checkbox) | "1" "2" "3" "4" |
| Tooltip item de conta fixa (lock) | "Vem das Contas fixas — edite na seção Contas fixas." |
| Título resumo | "Resumo do plano" |
| Label total planejado | "Total planejado" |
| Label folga | "Folga" |
| Folga negativa | "Passou do teto em R$ [valor]" |
| Empty state plano — heading | "Nenhum item planejado para este mês" |
| Empty state plano — body | "Adicione o primeiro item do plano ou copie o plano do mês anterior." |
| Empty state barra por grupo | "Nenhum item planejado para este mês." |
| Cabeçalho cartão semana | "Semana [1–4]" |
| Subtexto dias da semana | "dias [X]–[Y]" |
| Label campo gastei | "Gastei R$" |
| Tooltip gastei manual | "Valor digitado manualmente — toque em Recalcular para voltar ao automático." |
| Micro-ação recalcular gastei | "Recalcular" |
| Label restante por item | "Restante" |
| Label total da semana | "Total da semana" |
| Label restante da semana | "Restante da semana" |
| Cartão de semana vazio | "Nada planejado nesta semana." |
| Título seção contas fixas | "Contas fixas" |
| Nota automação contas fixas | "As contas fixas entram sozinhas no plano do mês, no grupo Contas fixas." |
| CTA nova conta fixa | "Nova conta fixa" |
| Título Sheet conta fixa — criação | "Nova conta fixa" |
| Título Sheet conta fixa — edição | "Editar conta fixa" |
| Label dia de vencimento | "Dia de vencimento" |
| Label débito automático | "Débito automático" |
| Pill débito automático | "Débito automático" |
| Empty state contas fixas | "Nenhuma conta fixa cadastrada" |
| Empty state contas fixas — body | "Cadastre luz, água, internet e outras contas que se repetem todo mês." |
| Título seção gastos do ano | "Gastos do ano" |
| CTA novo gasto anual | "Novo gasto anual" |
| Título Sheet gasto anual — criação | "Novo gasto anual" |
| Título Sheet gasto anual — edição | "Editar gasto anual" |
| Label valor no ano | "Valor no ano" |
| Label mês de vencimento | "Mês de vencimento" |
| Label guardar por mês | "Guardar por mês" |
| Empty state gastos do ano | "Nenhum gasto anual cadastrado" |
| Empty state gastos do ano — body | "Cadastre IPVA, licenciamento, manutenção do carro e presentes de fim de ano." |
| Título seção metas | "Metas" |
| CTA nova meta | "Nova meta" |
| Título Sheet meta — criação | "Nova meta" |
| Título Sheet meta — edição | "Editar meta" |
| Label valor da meta | "Valor da meta" |
| Label valor guardado | "Valor guardado" |
| Label prazo | "Prazo" |
| Progresso da meta (linha de valores) | "Guardado R$ [A] de R$ [B]" |
| Meta sem prazo — guardar por mês | "defina um prazo para calcular" |
| Meta sem prazo — rótulo | "sem prazo" |
| Badge meta concluída | "Concluída" |
| Empty state metas | "Nenhuma meta cadastrada" |
| Empty state metas — body | "Crie uma caixinha para a reserva de emergência ou para um objetivo específico." |
| CTA submit Sheet — criação | "Salvar" |
| CTA submit Sheet — edição | "Salvar alterações" |
| CTA submit Sheet — loading | "Salvando…" |
| Erro de servidor genérico | "Não foi possível salvar. Verifique sua conexão e tente novamente." |
| Erro validação — nome vazio | "O nome é obrigatório." |
| Erro validação — valor inválido | "Digite um valor maior que zero." |
| Erro validação — dia de vencimento | "Informe um dia entre 1 e 31." |
| Erro validação — semanas (item) | "Marque pelo menos uma semana." |
| Erro validação — grupo vazio | "Selecione um grupo." |
| Erro validação — valor guardado > meta | "O valor guardado não pode ser maior que a meta." |
| Destrutivo item — título | "Excluir item do plano?" |
| Destrutivo item — body | "Esta ação não pode ser desfeita. O item **[nome]** será removido do plano deste mês." |
| Destrutivo conta fixa — título | "Excluir conta fixa?" |
| Destrutivo conta fixa — body | "Esta ação não pode ser desfeita. **[nome]** deixará de entrar no plano dos próximos meses." |
| Destrutivo gasto anual — título | "Excluir gasto anual?" |
| Destrutivo gasto anual — body | "Esta ação não pode ser desfeita. O gasto **[nome]** será removido." |
| Destrutivo meta — título | "Excluir meta?" |
| Destrutivo meta — body | "Esta ação não pode ser desfeita. A meta **[nome]** e seu progresso serão removidos." |
| Destrutivo — CTA cancelar | "Manter" |
| Destrutivo — CTA confirmar | "Excluir" |
| Destrutivo — loading | "Excluindo…" |

---

## Interaction States

Herda os estados da Fase 2 (Sheet, Dialog, Input/Select focus, botões). Estados novos desta fase:

| Componente | Estado | Comportamento |
|------------|--------|---------------|
| Checkbox de semana | Marcado | `bg-casa text-white border-casa`; desmarcado: `border-border bg-card` |
| Checkbox de semana | Focus | `ring-2 ring-casa ring-offset-2` |
| Switch débito automático | Ligado | trilho `bg-casa`; desligado: `bg-border` |
| Switch débito automático | Focus | `ring-2 ring-casa` |
| Campo "Gastei R$" | Idle (automático) | valor da soma automática em `font-mono`, sem ícone de edição |
| Campo "Gastei R$" | Override manual | ícone `Pencil` 12px `text-casa` + micro-ação "Recalcular" visível |
| Campo "Gastei R$" | Focus / edição | `ring-2 ring-border`; salva em blur/Enter via Server Action |
| Barra por grupo / progresso de meta | Normal | preenchimento `bg-casa` |
| Barra de progresso de meta | Concluída (≥100%) | preenchimento `bg-positive` + badge "Concluída" |
| Cartão da semana atual | Realce | cabeçalho `bg-casa-light text-casa` |
| Teto do mês (inline) | Idle | valor `font-mono text-2xl`; hover: cursor `text-casa` + ícone `Pencil` 14px |
| Teto do mês (inline) | Edição | vira `Input inputMode="decimal"` `min-h-[44px]` |
| Linha de item do plano | Hover (desktop) | `bg-bg/60` |
| Cartão de meta / conta fixa / gasto anual | Loading inicial | `Skeleton` com as mesmas dimensões do cartão |

---

## Accessibility

Herda a base da Fase 2. Adições desta fase:

- `Checkbox` de semana: cada um com `<Label>` associado ("Semana 1" como `aria-label`, exibindo "1"); grupo envolto em `<fieldset>` com `<legend>` "Em quais semanas?".
- `Switch` débito automático: `role="switch"` + `aria-checked` (Radix fornece), `<Label htmlFor>` associado.
- Barras de progresso (grupo e meta): `role="progressbar"` com `aria-valuenow`, `aria-valuemin=0`, `aria-valuemax` = alvo; texto equivalente ("C%") visível ao lado.
- Campo "Gastei R$": `<Label>` associado; mudança de valor confirmada anuncia via `aria-live="polite"` no container de restante.
- Cartão da semana atual: `aria-current="true"` no cabeçalho para indicar a semana vigente.
- `Table` de itens (desktop): `<th scope="col">` em cada coluna; no mobile, cartões-lista com headings implícitos.
- `min-h-[44px]` / alvo de toque ≥ 44px em todos os interativos (incluindo Checkbox e Switch) — regra inviolável do spec.
- Cores positivo/warning nunca são o único sinal: folga negativa sempre acompanha o texto "Passou do teto em R$ X"; restante negativo acompanha o sinal de menos no valor.

---

## Responsive Breakpoints

| Contexto | Mobile (< 1024px) | Desktop (≥ 1024px) |
|----------|-------------------|--------------------|
| Tabela do plano | Cartões-lista empilhados (nome + grupo + valor + checkboxes + total) | `Table` com colunas, `overflow-x-auto` se necessário |
| Checkboxes de semana | Linha de 4, alvo 44px cada, com gap `sm` | Igual, inline na linha da tabela |
| Cartões semanais | 1 coluna empilhada | Grade 2×2 (ou 4 col. em telas ≥ xl) |
| Resumo do plano | Full width, barras por grupo empilhadas | Card único, barras por grupo em linha |
| Sheets (item/conta fixa/gasto anual/meta) | `side="bottom"`, `max-h-[90vh]` com scroll | `side="right"`, `w-[420px]` |
| Seções de contas fixas / gastos / metas | Cartões-lista e cartões de meta full width | Cartões de meta podem ir a grade 2 col. |
| Campo "Gastei R$" | `min-h-[44px]`, teclado numérico (`inputMode="decimal"`) | Igual |

---

## Registry Safety

| Registry | Componentes usados | Safety Gate |
|----------|--------------------|-------------|
| shadcn/ui oficial (`ui.shadcn.com`) | Reutilizados das Fases 1–2: Button, Input, Label, Card, Separator, Sheet, Skeleton, Dialog, Select, Badge. Novos nesta fase: Checkbox, Switch, Progress, Table | Não requerido — registry oficial |

Nenhum registry de terceiros nesta fase. Gate de vetting não aplicável.

---

## Rastreabilidade de Decisões

| Decisão | Fonte |
|---------|-------|
| Tokens de cor e fontes (todos reutilizados, nenhum novo) | `globals.css` + `spec.md §Visual` + `02-UI-SPEC.md` — pré-populado |
| `min-h-[44px]` em todos os interativos (incl. Checkbox/Switch) | `spec.md §Visual` — pré-populado |
| Checkboxes por semana = nº de vezes; total = valor × semanas marcadas | CONTEXT D-01 + `spec.md §3/§Cálculos` — pré-populado |
| "Gastei R$" automático (soma de Transactions) com override manual + Recalcular | CONTEXT D-02 — pré-populado |
| Grupo do item = Categoria da Casa existente (pill `bg-casa-light`) | CONTEXT D-03 — pré-populado |
| Primeiro mês pré-preenchido; demais vazios; botão copiar plano | CONTEXT D-04 + `spec.md §3` + PLAN-05 — pré-populado |
| Contas fixas entram automáticas e somente-leitura no plano (ícone Lock) | CONTEXT D-05 + PLAN-06 — pré-populado |
| Switch para débito automático | FIXA-01 + CONTEXT D-05 — pré-populado |
| Gasto anual "guardar por mês" = valor ÷ 12, somente exibição | CONTEXT D-05 + `spec.md §Cálculos` — pré-populado |
| Meta com barra de progresso + "guardar por mês" = (meta − guardado) ÷ meses até prazo | CONTEXT D-06 + META-01 + `spec.md §Cálculos` — pré-populado |
| Seed de 2 metas só com nome (Reserva de emergência, Caixinha do carro) | CONTEXT D-06 + META-02 — pré-populado |
| Semanas fixas 1–7 / 8–14 / 15–21 / 22–fim | `spec.md §Cálculos` + CONTEXT — pré-populado |
| Cartão "Planejado"/"Folga" do dashboard puxa total planejado real | CONTEXT code_context + `visao-geral/_components` (hoje "--") — pré-populado |
| Realce da semana atual (`bg-casa-light`) | Decisão de UX desta fase — orienta o usuário na semana vigente |
| Novos componentes shadcn: Checkbox, Switch, Progress, Table | Inferido dos campos/telas desta fase — registry oficial |
| Fase 3 sem uso de `text-empresa` | CONTEXT §Phase Boundary (fora de escopo: telas da Empresa) — pré-populado |

---

## Checker Sign-Off

- [ ] Dimensão 1 Copywriting: PASS
- [ ] Dimensão 2 Visuais: PASS
- [ ] Dimensão 3 Cor: PASS
- [ ] Dimensão 4 Tipografia: PASS
- [ ] Dimensão 5 Espaçamento: PASS
- [ ] Dimensão 6 Registry Safety: PASS

**Aprovação:** pendente
