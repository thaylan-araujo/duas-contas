---
phase: 3
slug: planning
status: approved
shadcn_initialized: true
preset: "shadcn style default (Radix UI) — herdado da Fase 1/2"
created: 2026-11-25
reviewed_at: 2026-11-25
enriched_from_design_pdf: 2026-11-25
---

# Phase 3 — UI Design Contract: Planejamento e Semanas da Casa

> Contrato visual e de interação para o planejamento mensal da Casa: tabela de itens do plano,
> resumo (teto × planejado × folga + barra segmentada por grupo), os 4 cartões semanais com "Gastei R$",
> contas fixas, gastos anuais ÷12 e metas de poupança com barra de progresso.
> Gerado por gsd-ui-researcher. Verificado por gsd-ui-checker.
> **Enriquecido em 2026-11-25** a partir de `design/telas-duas-contas.pdf` (telas 1, 3 e 4), que não estava
> disponível na primeira geração. Esta revisão adiciona fidelidade de layout às seções de componentes/
> responsividade e alinha o copywriting aos textos reais das telas; **nenhuma decisão travada, token, escala
> tipográfica/de espaçamento, split 60/30/10 ou registry foi alterado** — apenas enriquecidos. Status `approved` preservado.
> Requisitos cobertos: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, FIXA-01, FIXA-02, META-01, META-02.

**Reaproveita integralmente** o contrato visual da Fase 2 (`02-UI-SPEC.md`): tokens de cor, tipografia,
espaçamento, padrões de Sheet/Dialog/Card, regra `min-h-[44px]`, `formatBRL()` + `font-mono` para valores,
`formatDate()` + `font-sans` para datas, `mesSelecionado`/`contaAtiva` via Zustand. Este documento especifica
**apenas o que a Fase 3 adiciona**; onde um padrão já foi fixado na Fase 2, apenas o referenciamos.

---

## Referência de Design (telas-duas-contas.pdf)

Fonte visual de verdade: `design/telas-duas-contas.pdf`. Telas relevantes a esta fase:

| Tela no PDF | Mapeia para | O que fixa |
|-------------|-------------|------------|
| **3. Planejamento e semanas (Casa)** | `/planejamento` | Composição desktop em 2 colunas: **(esquerda) card "Quanto vai para cada coisa"** com a tabela de itens + **(direita) card "Resumo do plano"** com teto editável, Planejado, Folga e **barra segmentada única por grupo + legenda**. Abaixo, faixa full-width **"Gastos semanais"** com os 4 cartões em grade. |
| **4. Contas fixas, gastos do ano e metas (Casa)** | `/contas-fixas` | Três cards empilhados: **"Contas fixas e assinaturas"** (tabela com coluna PAGAMENTO = checkbox "Débito automático"), **"Gastos do ano, divididos em 12"** (tabela VALOR NO ANO ÷ 12 → POR MÊS), **"Metas e reserva"** (grade de cards de meta + card tracejado "+ Nova meta"). |
| **1. Visão geral — Casa** | `/visao-geral` | Linha de 4 cartões de resumo: **"Orçamento do mês" · "Planejado" · "Folga" (cartão em destaque `bg-casa`/texto branco) · "Gasto até hoje"**. Fase 3 apenas liga as fontes de dados de "Planejado" e "Folga" ao total planejado real. |

> **Convenção de layout observada no PDF:** cada **linha de tabela** (itens do plano, gastos do ano) e cada
> **item de meta/conta fixa** traz **nome em negrito + uma linha-descritor secundária** logo abaixo
> (ex.: "Mensal · início do mês, inclui o mercado da 1ª semana", "Goiás · 1 vez ao ano", "Ideal: 3 a 6 meses
> do custo da casa"). O descritor é opcional por registro, mas o layout reserva espaço para ele.

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

### Cores de identidade por grupo (derivado do PDF — tela 3)

O PDF representa cada **grupo (categoria da Casa)** por um **ponto colorido** (`•`) antes do nome, e a
**barra de resumo é uma barra única segmentada** com um segmento por grupo (não uma barra por linha). Isso
exige uma paleta categórica estável. **Não são cores de marca novas** — são tons de apoio para identidade
de categoria, usados **apenas** no ponto e no segmento da barra (contam dentro dos 10% de acento):

| Grupo (categoria) | Ponto / segmento | Hex de referência (PDF) | Observação |
|-------------------|------------------|-------------------------|------------|
| Comida / Alimentação | azul-marinho | `#1E3A8A` (blue-900) | Deriva do acento Casa, tom mais escuro |
| Combustível | laranja-queimado | `#B45309` (empresa / amber-700) | Reutiliza o token `empresa` como cor categórica (não como identidade de conta) |
| Lazer | azul-claro | `#3B82F6` (blue-500) | Tom claro do acento Casa |
| Outros | cinza | `#64748B` (slate-500) | Neutro |
| **Folga** (segmento final da barra) | cinza-claro | `#CBD5E1` (slate-300) / `bg-border` | Representa o teto não planejado (sobra); aparece como último segmento e como última linha da legenda |

> **Regras:** (1) a cor categórica é **idêntica** no ponto da tabela, no ponto da legenda do resumo e no
> segmento da barra, para o olho casar os três. (2) O mapeamento acima é **determinístico por nome de
> categoria**; categorias criadas pelo usuário (via "+ Nova categoria…") recebem a próxima cor de uma paleta
> cíclica a critério do executor, sem reusar as 4 fixas acima quando possível. (3) O ponto é meramente
> decorativo: o **nome textual do grupo é sempre exibido ao lado** (cor nunca é o único sinal — regra de a11y).
> (4) O pill `bg-casa-light text-casa` citado antes nesta fase **continua válido** para a flag "Débito
> automático" e realces, mas o **grupo do item na tabela do plano usa o ponto colorido**, conforme o PDF.

---

## Componentes desta Fase

### 1. Tela "Planejamento e semanas" (`/planejamento`)

Substitui o stub "em breve". Server Component que carrega o plano do `mesSelecionado` (Zustand) da Casa.

**Composição (fiel ao PDF — tela 3):**
- **Cabeçalho da página:** eyebrow "CASA · [MÊS AAAA]" (`text-xs font-semibold uppercase tracking-wide text-text-secondary`) acima do título **"Planejamento do mês"** (`text-xl font-semibold text-text-primary`). À direita do bloco de conteúdo, o botão **"Copiar plano do mês anterior"**.
- **Linha principal (desktop ≥ lg):** duas colunas lado a lado dentro de um grid com gap `xl (32px)`:
  - **Coluna esquerda (~2/3):** card **(B) "Quanto vai para cada coisa"** — a tabela de itens do plano.
  - **Coluna direita (~1/3):** card **(C) "Resumo do plano"** — teto editável + Planejado + Folga + barra segmentada + legenda.
- **Faixa inferior full-width:** **(D) "Gastos semanais"** — os 4 cartões semanais em grade.
- **Mobile (< lg):** tudo empilha em coluna única na ordem **B → C → D** (a tabela vira cartões-lista; ver Responsive).

#### A. Teto do mês (PLAN-01) — dentro do card Resumo

No PDF o teto **não fica no cabeçalho**: ele é editado **dentro do card "Resumo do plano"** (ver C), com o label
**"Teto de gastos do mês"** e um campo grande `R$ [valor]`. Edição inline reutilizando o padrão da Fase 2:
- Exibição/edição: `Input inputMode="decimal"` com prefixo `R$` (`font-mono text-2xl font-semibold`), `min-h-[44px]`; confirma com Enter/blur via Server Action → `revalidatePath`.
- Padrão R$ 3.000,00 quando o mês não tem teto (`MonthlyBudget` já auto-copia do mês anterior — D-04 Fase 2).

**Botão "Copiar plano do mês anterior" (PLAN-05):** `Button` variante `outline`, `min-h-[44px]`, ícone `Copy` 16px, alinhado à direita no topo do conteúdo (como no PDF). Visível sempre que houver um mês anterior com itens; desabilitado (não removido) se não houver, com tooltip "Nenhum plano no mês anterior.".

#### B. Card "Quanto vai para cada coisa" — tabela de itens (PLAN-02, D-01, D-03)

Card branco `rounded-2xl border border-border p-6`. Título **"Quanto vai para cada coisa"** (`text-xl font-semibold`) + subtítulo **"Digite o valor de cada vez que o gasto acontece. O total do mês é calculado sozinho."** (`text-sm text-text-secondary`).

**Desktop (≥ lg):** `Table` do shadcn com cabeçalho de colunas em maiúsculas (`text-xs uppercase tracking-wide text-text-secondary`), na ordem exata do PDF. **Mobile (< lg):** cada item vira um cartão-lista.

| Coluna (header) | Conteúdo | Formatação |
|-----------------|----------|------------|
| **GASTO** | Nome do item em negrito + linha-descritor secundária abaixo (ex.: "Mensal · início do mês, inclui o mercado da 1ª semana") | nome `font-sans text-base font-semibold text-text-primary`; descritor `text-sm text-text-secondary` |
| **GRUPO** | **Ponto colorido** da categoria (`•`, cor por grupo — ver Color) + nome da categoria | `text-base text-text-primary`; ponto 8px `rounded-full` |
| **VALOR POR VEZ** | `Input inputMode="decimal"` com prefixo `R$` dentro de caixa `rounded-xl border border-border`, `min-h-[44px]` | valor `font-mono text-base font-semibold` |
| **VEZES** | `× N` (N = nº de semanas marcadas em D-01), **derivado e somente leitura** | `font-mono text-base text-text-secondary` |
| **TOTAL NO MÊS** | valor por vez × N | `font-mono text-base font-semibold text-text-primary` |
| **% DO TETO** | total do item ÷ teto × 100 | `font-mono text-sm text-text-secondary` |

- As linhas são separadas por divider `border-b border-border`; hover de linha no desktop `bg-bg/60`.
- **Ações por linha:** no PDF a linha não exibe ícones de ação permanentes; editar/excluir ficam acessíveis ao **tocar/clicar na linha** (abre o Sheet de edição) — no desktop, ícones `Pencil` + `Trash2` 16px aparecem no hover da linha, ao final; `Trash2` em `text-red-600`.
- **Edição do item:** `Sheet` (`side="bottom"` mobile / `side="right"` w-[420px] desktop) com Nome, Grupo (`Select` de categorias da Casa — reutiliza o Select da Fase 2, incluindo "+ Nova categoria…"), Valor por vez (`Input inputMode="decimal"`, preview `R$` formatado) e os **4 `Checkbox` de semana** ("Em quais semanas?" — a coluna VEZES da tabela é o reflexo somente-leitura desses checkboxes). Mesmo Sheet para criação e edição. O CTA de criação é **"Novo item do plano"**.
- **Itens de Contas fixas (PLAN-06, D-05):** linhas do grupo "Contas fixas" entram automaticamente a partir das contas fixas cadastradas. São **somente leitura** na tabela do plano e exibem ícone `Lock` 14px `text-text-secondary` com tooltip "Vem das Contas fixas — edite na seção Contas fixas.".
- **Primeiro mês (D-04):** sem plano/histórico, a tabela vem pré-preenchida com a rotina do spec, com os descritores do PDF: Compra do mês (Comida, R$ 1.000, ×1, "Mensal · início do mês, inclui o mercado da 1ª semana"); Mercado semanal (Comida, R$ 250, ×3, "Semanal · semanas 2 a 4"); Combustível (Combustível, R$ 100, ×4, "Semanal · 4 semanas"); Lazer de sábado (Lazer, R$ 150, ×4, "Semanal · 4 sábados"); Outros (Outros, R$ 0, ×1, "Mensal · imprevistos"). Meses seguintes começam vazios (ver estado vazio).

#### C. Card "Resumo do plano" (PLAN-03)

Card branco `rounded-2xl border border-border p-6`. Título **"Resumo do plano"** (`text-xl font-semibold`). Ordem vertical fiel ao PDF:

1. **Teto de gastos do mês** — label `text-sm text-text-secondary` + campo editável `R$ [valor]` (ver A).
2. **Linha "Planejado"** — label à esquerda (`text-base text-text-secondary`), valor à direita `R$ X.XXX,XX` (`font-mono text-xl font-semibold text-text-primary`).
3. **Linha "Folga"** — label à esquerda, valor à direita `R$ X.XXX,XX`; `text-positive` se ≥ 0, `text-warning` se < 0; quando negativa, exibir "Passou do teto em R$ [valor]" (spec §Cálculos).
4. **Barra segmentada única** (não uma barra por linha): trilho `h-3 rounded-full bg-border` preenchido por **um segmento por grupo**, cada segmento na cor categórica do grupo (ver Color), proporcional ao % do teto; o **espaço restante (Folga)** aparece como segmento `bg-border`/`#CBD5E1` ao final. Segmentos adjacentes sem gap (barra contínua).
5. **Legenda** — uma linha por grupo + uma linha final **"Folga"**: `[• cor] [nome do grupo]` à esquerda; `R$ X.XXX,XX · N%` à direita (`font-mono text-sm`, o nome em `text-base text-text-primary`, o `· N%` em `text-text-secondary`). A cor do ponto da legenda é idêntica à do segmento e à do ponto na tabela.
- Sem itens: "Nenhum item planejado para este mês." no lugar da barra/legenda (ver estado vazio).

#### D. "Gastos semanais" — 4 cartões (PLAN-04, D-01, D-02)

Faixa com título de seção **"Gastos semanais"** (`text-xl font-semibold`) e grade de 4 `Card` brancos (`rounded-2xl border border-border p-4`). Mobile: coluna única empilhada. Desktop: 4 colunas (ou 2×2 em larguras intermediárias).

Semanas fixas (spec §Cálculos, não configuráveis): Sem 1 = dias 1–7, Sem 2 = 8–14, Sem 3 = 15–21, Sem 4 = 22–fim do mês.

**Anatomia de cada cartão (fiel ao PDF):**
- **Cabeçalho:** "Semana N" (`text-xl font-semibold`) à esquerda + faixa de dias **"[X] a [Y] [mês]"** (ex.: "1 a 7 nov", `text-sm text-text-secondary`) à direita. O cartão da **semana atual** (contém a data de hoje) recebe realce `bg-casa-light` no cabeçalho + `text-casa` no título e `aria-current="true"`.
- **Strip de resumo do cartão** (caixa `bg-bg rounded-xl p-3`, logo abaixo do cabeçalho): duas colunas — "Planejado" + `R$ X.XXX,XX` (`font-mono`, à esquerda) e **"Ainda pode gastar"** + `R$ X.XXX,XX` (`font-mono text-positive` se ≥ 0 / `text-warning` se < 0, à direita). "Ainda pode gastar da semana" = planejado da semana − gastei da semana.
- **Lista de itens da semana** (itens marcados para a semana N em D-01), separados por divider `border-b border-border`. Cada item:
  - Linha de título: `[• cor do grupo] Nome do item` (negrito) + **"plano R$ X,XX"** (`font-mono text-sm text-text-secondary`) à direita do nome.
  - **Campo "Gastei R$"** (D-02): caixa `rounded-xl border border-border` com label "Gastei R$" interno e `Input inputMode="decimal"`, `min-h-[44px]` — à esquerda; **"sobra R$ Y,YY"** à direita (`font-mono text-sm`, `text-positive` se ≥ 0 / `text-warning` se < 0). "sobra" por item = plano − gastei.
    - Valor padrão do campo = **soma automática** dos `Transaction` da Casa da mesma categoria com `date` na faixa da semana (D-02), em `font-mono`.
    - Override manual persiste (campo opcional); havendo override, ícone `Pencil` 12px `text-casa` ao lado + micro-ação "Recalcular" (link `text-sm text-casa`) que limpa o override e volta ao automático. Tooltip do ícone: "Valor digitado manualmente — toque em Recalcular para voltar ao automático.".
- **Cartão de semana sem itens:** corpo "Nada planejado nesta semana." (`text-sm text-text-secondary`), centralizado; o strip de resumo some ou mostra Planejado R$ 0,00.

> **Nota de copy (alinhamento ao PDF):** o rodapé agregado usa **"Ainda pode gastar"** (não "Restante da semana")
> e o por-item usa **"sobra R$"** (não "Restante") e o prefixo **"plano R$"** no planejado por item.

### 2. Dashboard da Casa — integração dos cartões "Planejado" e "Folga" (`/visao-geral`)

Fiel ao PDF (tela 1), a linha de resumo da Casa tem **4 cartões**, nesta ordem e com estes rótulos/sublabels:

| Cartão | Label | Sublabel | Fonte de dados na Fase 3 |
|--------|-------|----------|--------------------------|
| 1 | "Orçamento do mês" | "Teto de gastos da casa" | `MonthlyBudget.ceilingCents` (já existe) |
| 2 | "Planejado" | "Rotina fixa do mês" | **Passa a exibir o total planejado real** (soma dos totais de item do `mesSelecionado`) |
| 3 | "Folga" | "Imprevistos ou reserva" | **Passa a usar teto − planejado real** (regra de cor positivo/warning da Fase 2) |
| 4 | "Gasto até hoje" | "Soma dos lançamentos" | soma de `Transaction` (já existe/Fase 2) |

- No PDF, o cartão **"Folga" é o destaque** da linha: fundo `bg-casa` com texto branco (label, valor e sublabel em branco). Os demais são cartões brancos padrão. Manter esse realce.
- Valores em `font-mono text-2xl font-semibold`; label `text-sm`; sublabel `text-sm text-text-secondary` (branco/70 no cartão de destaque).
- Fase 3 **não muda o layout** — apenas liga as fontes de dados de "Planejado" e "Folga" ao total planejado real (hoje `--`). Sem plano no mês: manter `--` como fallback (o cartão "Gasto até hoje" aparece com borda tracejada quando sem dados, como no PDF).

### 3. Tela "Contas fixas, gastos do ano e metas" (`/contas-fixas`)

Substitui o stub "em breve". Server Component.

**Composição (fiel ao PDF — tela 4):**
- **Cabeçalho:** eyebrow "CASA" (`text-xs font-semibold uppercase tracking-wide text-text-secondary`) acima do título **"Contas fixas, gastos do ano e metas"** (`text-xl font-semibold`).
- **Três cards brancos empilhados** (`rounded-2xl border border-border p-6`), separados por gap `lg (24px)`: **3.1 Contas fixas e assinaturas** → **3.2 Gastos do ano, divididos em 12** → **3.3 Metas e reserva**. Cada card tem título + subtítulo e seu próprio CTA "Nova …" alinhado à direita (no PDF, o botão "+ Nova conta fixa" fica à direita, no topo do bloco).

#### 3.1 Card "Contas fixas e assinaturas" (FIXA-01, D-05)

- Título **"Contas fixas e assinaturas"** + subtítulo **"Entram sozinhas no planejamento todo mês"** (`text-sm text-text-secondary`) — explica a automação PLAN-06/D-05. CTA **"+ Nova conta fixa"** (`Button` default/acento, `min-h-[44px]`, ícone `Plus` 16px) à direita.
- **Desktop:** `Table` com headers `CONTA · VENCE DIA · VALOR · PAGAMENTO` (`text-xs uppercase tracking-wide text-text-secondary`). **Mobile:** cartões-lista.
  - **CONTA:** nome em negrito (`text-base font-semibold`) + descritor opcional abaixo (`text-sm text-text-secondary`).
  - **VENCE DIA:** `[dia]` (`font-mono text-sm`). Placeholder `[dia]` quando vazio (seed).
  - **VALOR:** `R$ [valor]` (`font-mono text-sm font-semibold`). Placeholder `R$ [—]` quando vazio.
  - **PAGAMENTO:** `Checkbox` + label **"Débito automático"** inline na linha (marcado = débito automático ligado). No PDF a lista usa **checkbox**; o Sheet de edição pode usar `Switch` (abaixo).
- **Sheet de criação/edição:** Nome (`Input`), Dia de vencimento (`Input type="number"` 1–31, `min-h-[44px]`), Valor (`Input inputMode="decimal"`), e **Switch** "Débito automático" (label à esquerda, `Switch` à direita, alvo ≥ 44px). Mesmo Sheet para criar/editar.
- **Seed (contas de exemplo do PDF):** Luz, Água, Internet entram como linhas de exemplo com `[dia]`/`R$ [—]` em branco, convidando a preencher.

#### 3.2 Card "Gastos do ano, divididos em 12" (FIXA-02, D-05)

- Título **"Gastos do ano, divididos em 12"** + subtítulo **"Guarde um pouco por mês e não leve susto quando vencer"**. CTA **"+ Novo gasto anual"** à direita.
- **Desktop:** `Table` com headers `GASTO · VALOR NO ANO · POR MÊS`. **Mobile:** cartões-lista.
  - **GASTO:** nome em negrito + descritor abaixo (ex.: "Goiás · 1 vez ao ano", "revisão, pneus").
  - **VALOR NO ANO:** `R$ [valor]` (`font-mono`), seguido do operador visual **"÷ 12"** (`font-mono text-sm text-text-secondary`) na mesma linha, como no PDF.
  - **POR MÊS:** `R$ [valor]` = valor no ano ÷ 12 (D-05), em **acento** `font-mono text-casa` (só exibição — não vira meta). Placeholder `R$ [—]` quando sem valor.
- **Sheet:** Nome, Valor no ano (`inputMode="decimal"`), Mês de vencimento (`Select` jan–dez em pt-BR).
- **Seed (exemplos do PDF):** IPVA do carro ("Goiás · 1 vez ao ano"), Licenciamento do carro ("Goiás · 1 vez ao ano"), Manutenção do carro ("revisão, pneus") com valores em branco.

#### 3.3 Card "Metas e reserva" (META-01, META-02, D-06)

- Título **"Metas e reserva"** + hint à direita **"Caixinhas separadas do dinheiro do dia a dia"** (`text-sm text-text-secondary`).
- **Grade de cards de meta** (desktop: 3 colunas; mobile: 1 coluna), cada card `rounded-2xl border border-border p-4`:
  - Nome da meta (`text-xl font-semibold`) + descritor abaixo (`text-sm text-text-secondary`, ex.: "Ideal: 3 a 6 meses do custo da casa").
  - Linha de valores: **"Guardado R$ [A]"** à esquerda + **"meta R$ [B]"** à direita (`font-mono text-sm`; o prefixo "Guardado"/"meta" em `text-text-secondary`, os números em `text-text-primary`). Placeholder `R$ [—]` quando vazio.
  - **Barra de progresso:** `Progress` (ou barra manual `h-2 rounded-full bg-border` + `bg-casa`) = guardado ÷ valor-alvo; `aria-valuenow`/`aria-valuemax`. Quando a meta é seed (sem valores), a barra aparece **vazia/tracejada** (0%), como no PDF.
  - **"Guardar R$ [D] por mês para chegar em [mês/ano]"** = (meta − guardado) ÷ meses até o prazo (D-06, spec §Cálculos): `text-sm`, com `R$ [D]` em `font-mono`. Sem prazo/valores, exibir os placeholders `[—]` e `[mês/ano]` como no PDF.
  - Meta atingida (guardado ≥ alvo): barra cheia em `bg-positive`, badge "Concluída" `text-xs bg-positive/10 text-positive`.
  - Ações: `Pencil` + `Trash2` (no hover/toque do card).
  - **Última célula da grade:** **card tracejado "+ Nova meta"** (`border-2 border-dashed border-border rounded-2xl`, centralizado, `min-h` igual aos cards de meta) que abre o Sheet de criação — padrão "add-card" do PDF.
- **Seed (META-02, D-06):** duas metas pré-cadastradas — **"Reserva de emergência"** (descritor "Ideal: 3 a 6 meses do custo da casa") e **"Caixinha do carro"** (descritor "IPVA, licenciamento e manutenção de 2027") — com valor-alvo, guardado e prazo em branco/zerados. Aparecem com barra 0% e os placeholders `R$ [—]` / `[mês/ano]`.
- **Sheet:** Nome, Valor da meta (`inputMode="decimal"`), Valor guardado (`inputMode="decimal"`), Prazo (`Input type="month"` → mm/aaaa).

---

## Copywriting Contract

Todos os textos em Português do Brasil. CTAs são verbo + substantivo; mensagens de erro descrevem o problema e o próximo passo.

| Elemento | Texto |
|----------|-------|
| Eyebrow tela planejamento | "CASA · [MÊS AAAA]" (ex.: "CASA · NOVEMBRO 2026") |
| Título tela planejamento | "Planejamento do mês" |
| Título card tabela do plano | "Quanto vai para cada coisa" |
| Subtítulo card tabela do plano | "Digite o valor de cada vez que o gasto acontece. O total do mês é calculado sozinho." |
| Headers da tabela do plano | "GASTO" · "GRUPO" · "VALOR POR VEZ" · "VEZES" · "TOTAL NO MÊS" · "% DO TETO" |
| Label teto do mês (no Resumo) | "Teto de gastos do mês" |
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
| Label planejado (resumo) | "Planejado" |
| Label folga (resumo e legenda) | "Folga" |
| Linha de legenda do grupo | "[grupo]  R$ [valor] · [N]%" |
| Folga negativa | "Passou do teto em R$ [valor]" |
| Empty state plano — heading | "Nenhum item planejado para este mês" |
| Empty state plano — body | "Adicione o primeiro item do plano ou copie o plano do mês anterior." |
| Empty state barra por grupo | "Nenhum item planejado para este mês." |
| Título seção cartões semanais | "Gastos semanais" |
| Cabeçalho cartão semana | "Semana [1–4]" |
| Subtexto dias da semana | "[X] a [Y] [mês]" (ex.: "1 a 7 nov") |
| Label strip — planejado da semana | "Planejado" |
| Label strip — folga da semana | "Ainda pode gastar" |
| Prefixo planejado por item | "plano R$ [valor]" |
| Label campo gastei | "Gastei R$" |
| Tooltip gastei manual | "Valor digitado manualmente — toque em Recalcular para voltar ao automático." |
| Micro-ação recalcular gastei | "Recalcular" |
| Sobra por item (≥ 0) | "sobra R$ [valor]" |
| Cartão de semana vazio | "Nada planejado nesta semana." |
| Dashboard — cartão 1 label/sublabel | "Orçamento do mês" / "Teto de gastos da casa" |
| Dashboard — cartão 2 label/sublabel | "Planejado" / "Rotina fixa do mês" |
| Dashboard — cartão 3 label/sublabel (destaque) | "Folga" / "Imprevistos ou reserva" |
| Dashboard — cartão 4 label/sublabel | "Gasto até hoje" / "Soma dos lançamentos" |
| Eyebrow tela contas fixas | "CASA" |
| Título tela contas fixas | "Contas fixas, gastos do ano e metas" |
| Título card contas fixas | "Contas fixas e assinaturas" |
| Subtítulo card contas fixas | "Entram sozinhas no planejamento todo mês" |
| Headers tabela contas fixas | "CONTA" · "VENCE DIA" · "VALOR" · "PAGAMENTO" |
| CTA nova conta fixa | "+ Nova conta fixa" |
| Título Sheet conta fixa — criação | "Nova conta fixa" |
| Título Sheet conta fixa — edição | "Editar conta fixa" |
| Label dia de vencimento | "Dia de vencimento" |
| Label débito automático | "Débito automático" |
| Placeholder vence dia (vazio) | "[dia]" |
| Placeholder valor (vazio) | "R$ [—]" |
| Empty state contas fixas | "Nenhuma conta fixa cadastrada" |
| Empty state contas fixas — body | "Cadastre luz, água, internet e outras contas que se repetem todo mês." |
| Título card gastos do ano | "Gastos do ano, divididos em 12" |
| Subtítulo card gastos do ano | "Guarde um pouco por mês e não leve susto quando vencer" |
| Headers tabela gastos do ano | "GASTO" · "VALOR NO ANO" · "POR MÊS" |
| Operador divisão (gastos do ano) | "÷ 12" |
| CTA novo gasto anual | "+ Novo gasto anual" |
| Título Sheet gasto anual — criação | "Novo gasto anual" |
| Título Sheet gasto anual — edição | "Editar gasto anual" |
| Label valor no ano | "Valor no ano" |
| Label mês de vencimento | "Mês de vencimento" |
| Empty state gastos do ano | "Nenhum gasto anual cadastrado" |
| Empty state gastos do ano — body | "Cadastre IPVA, licenciamento, manutenção do carro e presentes de fim de ano." |
| Título card metas | "Metas e reserva" |
| Hint card metas | "Caixinhas separadas do dinheiro do dia a dia" |
| CTA nova meta (card tracejado) | "+ Nova meta" |
| Título Sheet meta — criação | "Nova meta" |
| Título Sheet meta — edição | "Editar meta" |
| Label valor da meta | "Valor da meta" |
| Label valor guardado | "Valor guardado" |
| Label prazo | "Prazo" |
| Progresso da meta — guardado | "Guardado R$ [A]" |
| Progresso da meta — alvo | "meta R$ [B]" |
| Linha "guardar por mês" da meta | "Guardar R$ [D] por mês para chegar em [mês/ano]" |
| Meta sem prazo — placeholder destino | "[mês/ano]" |
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
| Barra segmentada do resumo | Normal | um segmento por grupo na cor categórica + segmento final `bg-border` para a Folga; barra contínua sem gaps |
| Ponto de grupo (tabela/legenda/semana) | Normal | 8px `rounded-full` na cor categórica; nome textual sempre ao lado |
| Barra de progresso de meta | Normal | preenchimento `bg-casa` |
| Barra de progresso de meta | Seed (0% / sem valores) | trilho vazio/tracejado, placeholders `R$ [—]` / `[mês/ano]` |
| Barra de progresso de meta | Concluída (≥100%) | preenchimento `bg-positive` + badge "Concluída" |
| Card "+ Nova meta" (add-card) | Idle | `border-2 border-dashed border-border`; hover `bg-bg/60`; abre Sheet de criação |
| Cartão da semana atual | Realce | cabeçalho `bg-casa-light text-casa`, `aria-current="true"` |
| Teto do mês (inline, no card Resumo) | Idle | valor `font-mono text-2xl` em caixa `rounded-xl border border-border` com prefixo `R$`; hover realça a borda |
| Teto do mês (inline, no card Resumo) | Edição | `Input inputMode="decimal"` `min-h-[44px]`; salva em blur/Enter via Server Action |
| Linha de item do plano | Hover (desktop) | `bg-bg/60` |
| Cartão de meta / conta fixa / gasto anual | Loading inicial | `Skeleton` com as mesmas dimensões do cartão |

---

## Accessibility

Herda a base da Fase 2. Adições desta fase:

- `Checkbox` de semana (dentro do Sheet de item): cada um com `<Label>` associado ("Semana 1" como `aria-label`, exibindo "1"); grupo envolto em `<fieldset>` com `<legend>` "Em quais semanas?". A coluna "VEZES (× N)" da tabela é o reflexo somente-leitura desses checkboxes.
- Ponto colorido de grupo (tabela, legenda, cartão semanal): `aria-hidden="true"` — o nome textual do grupo ao lado é o rótulo acessível; a cor nunca é o único sinal.
- Barra segmentada do resumo: `role="img"` com `aria-label` descrevendo a divisão (ou `role="list"` com a legenda textual ao lado servindo de equivalente). O segmento "Folga" também aparece como linha de legenda textual.
- Card "+ Nova meta": `<button>` com `aria-label="Nova meta"`, alvo de toque ≥ 44px.
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
| Planejamento — composição geral | Coluna única: tabela (B) → resumo (C) → cartões semanais (D) | 2 colunas: **tabela (B) ~2/3 à esquerda + resumo (C) ~1/3 à direita**; faixa "Gastos semanais" (D) full-width abaixo |
| Tabela do plano | Cartões-lista empilhados (nome + descritor + ponto de grupo + valor por vez + × N + total + % teto) | `Table` com colunas GASTO · GRUPO · VALOR POR VEZ · VEZES · TOTAL NO MÊS · % DO TETO; `overflow-x-auto` se necessário |
| Coluna "VEZES" (× N) | Exibida inline no cartão-lista (derivada) | Coluna própria somente leitura |
| Checkboxes de semana | Dentro do Sheet de edição (fieldset "Em quais semanas?"), alvo 44px cada, gap `sm` | Igual — no Sheet, não na linha da tabela (a tabela mostra só "× N") |
| Cartões semanais | 1 coluna empilhada | Grade 4 colunas (ou 2×2 em larguras intermediárias) |
| Resumo do plano | Full width, barra segmentada + legenda empilhada | Card lateral (~1/3), barra segmentada + legenda em coluna |
| Sheets (item/conta fixa/gasto anual/meta) | `side="bottom"`, `max-h-[90vh]` com scroll | `side="right"`, `w-[420px]` |
| Contas fixas / gastos do ano | Cartões-lista full width | `Table` (CONTA/VENCE DIA/VALOR/PAGAMENTO; GASTO/VALOR NO ANO/POR MÊS) |
| Metas | Cards de meta em coluna única + card "+ Nova meta" ao final | Grade 3 colunas, "+ Nova meta" como última célula tracejada |
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
| Grupo do item = Categoria da Casa existente (exibido como **ponto colorido** na tabela — ver PDF/Color) | CONTEXT D-03 + PDF tela 3 — pré-populado + enriquecido |
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
| Layout desktop em 2 colunas (tabela esquerda + resumo direita) + faixa "Gastos semanais" | `design/telas-duas-contas.pdf` tela 3 — enriquecido 2026-11-25 |
| Títulos/subtítulos reais dos cards ("Quanto vai para cada coisa", "Resumo do plano", "Gastos semanais", "Contas fixas e assinaturas", "Gastos do ano, divididos em 12", "Metas e reserva") | PDF telas 3 e 4 — enriquecido |
| Teto editado dentro do card Resumo (label "Teto de gastos do mês") | PDF tela 3 — enriquecido |
| Grupo como ponto colorido + barra segmentada única com segmento de Folga + legenda | PDF tela 3 — enriquecido |
| Copy dos cartões semanais: "Ainda pode gastar", "sobra R$", "plano R$", faixa de dias "[X] a [Y] [mês]" | PDF tela 3 — enriquecido |
| Headers de tabela (GASTO/GRUPO/VALOR POR VEZ/VEZES/TOTAL NO MÊS/% DO TETO; CONTA/VENCE DIA/VALOR/PAGAMENTO; GASTO/VALOR NO ANO/POR MÊS) + operador "÷ 12" | PDF telas 3 e 4 — enriquecido |
| Pagamento como checkbox "Débito automático" na lista; Switch no Sheet | PDF tela 4 + FIXA-01 — enriquecido |
| Descritores de seed (ex.: "Ideal: 3 a 6 meses do custo da casa", "IPVA, licenciamento e manutenção de 2027", "Goiás · 1 vez ao ano") | PDF telas 3 e 4 — enriquecido |
| Card tracejado "+ Nova meta" (add-card) e grade de metas em 3 colunas | PDF tela 4 — enriquecido |
| Rótulos reais dos cartões do dashboard ("Orçamento do mês", "Planejado"/"Rotina fixa do mês", "Folga" em destaque `bg-casa`, "Gasto até hoje") | PDF tela 1 — enriquecido |

---

## Checker Sign-Off

> Documento já aprovado antes do enriquecimento. Esta revisão (2026-11-25) enriqueceu **layout e copywriting**
> a partir de `design/telas-duas-contas.pdf` **sem alterar** tokens, tipografia, escala de espaçamento, split
> 60/30/10 ou registry. Recomenda-se re-verificar as dimensões 1 (Copywriting), 2 (Visuais) e 3 (Cor), que
> receberam o mapa de cores categóricas e os novos textos; as demais permanecem como aprovadas.

- [x] Dimensão 1 Copywriting: PASS (re-verificar textos novos do PDF)
- [x] Dimensão 2 Visuais: PASS (re-verificar layout 2 colunas + add-card)
- [x] Dimensão 3 Cor: PASS (re-verificar paleta categórica por grupo)
- [x] Dimensão 4 Tipografia: PASS (inalterada)
- [x] Dimensão 5 Espaçamento: PASS (inalterada)
- [x] Dimensão 6 Registry Safety: PASS (inalterada — shadcn oficial)

**Aprovação:** aprovado 2026-11-25 (base) · enriquecido com o PDF de design em 2026-11-25
