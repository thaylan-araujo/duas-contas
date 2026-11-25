---
phase: 2
slug: core-crud
status: draft
shadcn_initialized: true
preset: "shadcn@4.22.0 estilo default (Radix UI)"
created: 2026-11-23
---

# Phase 2 — UI Design Contract: Core CRUD

> Contrato visual e de interação para lançamentos, pró-labore e dashboard da Casa.
> Gerado por gsd-ui-researcher. Verificado por gsd-ui-checker.
> Requisitos cobertos: LANC-01, LANC-02, LANC-03, LANC-04, LANC-05, LANC-06, DASH-01, DASH-02.

---

## Design System

| Propriedade | Valor |
|-------------|-------|
| Ferramenta | shadcn/ui v4.22.0 |
| Preset | estilo "default" (não "base-nova") — fixado por conflito date-fns@3 |
| Biblioteca de componentes | Radix UI (via shadcn) |
| Biblioteca de ícones | lucide-react (já instalado na Fase 1) |
| Fonte da interface | Manrope via `--font-sans` |
| Fonte dos números | IBM Plex Mono via `--font-mono` |

**Fonte:** `01-01-SUMMARY.md` + `globals.css` (Fase 1).

**Componentes shadcn já instalados (Fase 1):** Button, Input, Label, Card, Separator, Sheet, Skeleton.

**Novos componentes shadcn necessários nesta fase:**
- `Dialog` — confirmação de exclusão
- `Select` — dropdowns de tipo, categoria, conta
- `Badge` — indicadores de tipo ENTRADA/SAÍDA nas linhas da lista
- `Tabs` — alternar visualização no dashboard (Casa / Empresa — preparação visual)

---

## Spacing Scale

Escala de 4 pontos. Fonte: `spec.md §Visual` + padrão shadcn/ui.

| Token | Valor | Uso nesta fase |
|-------|-------|----------------|
| xs | 4px | Gap entre ícone e label inline |
| sm | 8px | Padding interno de Badge; gap entre campo e label |
| md | 16px | Padding padrão de Card; espaçamento entre campos do form |
| lg | 24px | Padding horizontal de Sheet e Dialog; gap entre seções |
| xl | 32px | Gap entre grupos de cartões no dashboard |
| 2xl | 48px | Separador entre header da página e conteúdo |
| 3xl | 64px | Não usado nesta fase |

**Exceções:**
- Todos os botões e campos interativos: `min-h-[44px]` (toque mobile — regra inviolável do spec).
- Espaço seguro inferior do BottomNav: `env(safe-area-inset-bottom)` via CSS inline (já implementado na Fase 1).

---

## Typography

Fonte: `spec.md §Visual` + `globals.css` + padrões observados em `Sidebar.tsx` e `BottomNav.tsx`.

| Papel | Tamanho | Peso | Line-height | Fonte | Uso nesta fase |
|-------|---------|------|-------------|-------|----------------|
| Display (valor monetário) | 24px (`text-2xl`) | 600 (semibold) | 1.2 | IBM Plex Mono (`font-mono`) | Totais de dashboard (teto, planejado, folga, gasto) |
| Heading de seção | 20px (`text-xl`) | 600 (semibold) | 1.2 | Manrope (`font-sans`) | Título de cartão de dashboard, título de Sheet/Dialog |
| Body | 16px (`text-base`) | 400 (regular) | 1.5 | Manrope (`font-sans`) | Itens da lista de lançamentos, labels de campo |
| Label / Metadado / Valor inline | 14px (`text-sm`) | 400 (regular) | 1.4 | Manrope (`font-sans`) / IBM Plex Mono (`font-mono`) | Data, categoria, conta, valor R$ em linha de lançamento |

> **12px (`text-xs`) — fora do escopo desta fase.** O tamanho de 12px pertence ao shell de navegação (labels do BottomNav e rótulos de grupo da Sidebar) implementado na Fase 1. O executor deve reutilizar as classes já definidas em `BottomNav.tsx` e `Sidebar.tsx` sem redeclará-las aqui.

**Pesos em uso nesta fase: 400 (regular) e 600 (semibold) — máximo 2 pesos.**

**Regra:** qualquer string formatada por `formatBRL()` usa `font-mono`. Datas exibidas via `formatDate()` usam `font-sans text-sm text-text-secondary`.

---

## Color

Fonte: `globals.css` + `spec.md §Visual`. Nenhuma cor nova é introduzida nesta fase.

| Papel | Hex | Token CSS | Uso |
|-------|-----|-----------|-----|
| Dominante (60%) | `#F3F5F7` | `bg-bg` | Fundo da página, fundo dos campos de formulário |
| Secundário (30%) | `#FFFFFF` | `bg-card` | Cartões do dashboard, Sheet, Dialog, linhas da lista |
| Borda | `#E3E7EC` | `border-border` | Separadores de cartão, bordas de campo, dividers da lista |
| Texto principal | `#0F1B2D` | `text-text-primary` | Títulos, descrição do lançamento, labels |
| Texto secundário | `#5B6675` | `text-text-secondary` | Data, categoria, conta, placeholder |
| Acento Casa | `#1D4ED8` | `text-casa` / `bg-casa` | Ver "Acento reservado para" abaixo |
| Fundo claro Casa | `#DCEBFF` | `bg-casa-light` | Ver "Acento reservado para" abaixo |
| Acento Empresa | `#B45309` | `text-empresa` / `bg-empresa` | Ver "Acento reservado para" abaixo |
| Fundo claro Empresa | `#FDEBD8` | `bg-empresa-light` | Ver "Acento reservado para" abaixo |
| Positivo (sobra) | `#0F766E` | `text-positive` | Valor de folga (teto − planejado), saldo positivo, Badge ENTRADA |
| Atenção (passou do plano) | `#8A3A06` | `text-warning` | Folga negativa ("Passou do teto em R$ X"), saldo negativo |
| Destrutivo | `#DC2626` | — (Tailwind `red-600`) | Badge SAÍDA; botão "Excluir" no Dialog de confirmação |

**Acento Casa (`#1D4ED8` / `#DCEBFF`) reservado para:**
1. Badge ou pill "Casa" na linha de lançamento quando conta = CASA
2. Estado ativo de itens Casa na Sidebar (`bg-casa-light text-casa`)
3. Badge ativo de conta no seletor de conta do formulário
4. Borda ou sublinhado do cartão de dashboard quando contexto = Casa

**Acento Empresa (`#B45309` / `#FDEBD8`) reservado para:**
1. Badge ou pill "Empresa" na linha de lançamento quando conta = EMPRESA
2. Estado ativo de itens Empresa na Sidebar (`bg-empresa-light text-empresa`)
3. Badge ativo de conta no seletor de conta do formulário
4. Borda ou sublinhado do cartão de dashboard quando contexto = Empresa

**Regra de split 60/30/10:** Fundo bg + campos (60%) → Cartões brancos + modais (30%) → Cor de conta + positivo/warning (10%). Nunca use `text-casa` ou `text-empresa` em texto de corpo corrido; apenas em elementos de identidade de conta e estados ativos.

---

## Componentes desta Fase

### 1. Formulário de Lançamento (Sheet)

**Padrão:** `Sheet` do shadcn/ui. `side="bottom"` no mobile (< lg), `side="right"` no desktop (≥ lg). Largura desktop: `w-[420px]`.

**Campos obrigatórios (ordem no form):**

| Campo | Componente | Validação |
|-------|-----------|-----------|
| Conta | Botões toggle — `bg-casa-light/text-casa` ou `bg-empresa-light/text-empresa` quando selecionado | Obrigatório |
| Tipo | `Select` — opções: "Entrada", "Saída" | Obrigatório |
| Data | `Input` type="date" com `formatDate()` para exibição | Obrigatório; padrão: hoje |
| Descrição | `Input` placeholder="Ex.: Mercado" | Obrigatório; máx. 120 chars |
| Valor | `Input` type="text" inputMode="decimal" placeholder="0,00" com `font-mono` | Obrigatório; > 0 |
| Categoria | `Select` — carregado por conta selecionada | Obrigatório |
| Observação | `Input` placeholder="Opcional" | Opcional; máx. 200 chars |

**Estado especial — Pró-labore (LANC-05):**
- Quando usuário seleciona Tipo = "Pró-labore" (terceira opção no Select de Tipo), o campo Conta desaparece e é substituído por texto fixo: "Saída da Empresa → Entrada na Casa".
- Campo Valor permanece; Categoria é preenchida automaticamente com "Pró-labore" (categoria seedada).
- Botão de submit muda para "Registrar Pró-labore".
- Tooltip/helper text abaixo do campo: "Uma única operação cria os dois lançamentos atomicamente."

**Comportamento do campo Valor:**
- `inputMode="decimal"` para abrir teclado numérico no mobile.
- Aceita entrada com vírgula (pt-BR) ou ponto; normaliza para centavos antes de enviar ao Server Action.
- Exibe placeholder `0,00` com `font-mono text-text-secondary`.
- Após digitação, exibe valor formatado `R$ 1.234,56` como preview abaixo do campo em `font-mono text-sm`.

**Estados do botão de submit:**
- Idle: "Salvar lançamento" (criação) / "Salvar alterações" (edição)
- Loading: "Salvando…" com `aria-busy="true"` e spinner 16px
- Erro: botão volta ao estado idle; mensagem de erro exibida acima do botão

**Gestão de categorias (LANC-06):**
- No Select de Categoria: último item da lista é "+ Nova categoria…"
- Ao selecionar "+ Nova categoria…": Sheet abre um campo inline adicional para o nome da nova categoria (não abre novo Sheet nem Dialog)
- Ao confirmar inline: categoria criada via Server Action, Select atualiza automaticamente com a nova opção selecionada

### 2. Lista de Lançamentos (`/lancamentos`)

**Layout:** coluna única, cartões-lista (cada lançamento é uma linha dentro de um Card).

**Cabeçalho da página:**
- Título: "Lançamentos" (`text-xl font-semibold text-text-primary`)
- Seletor de mês: componente já implementado via Zustand `mesSelecionado` — botões `<` mês `>` em linha
- Botão "+ Novo lançamento": `Button` variante default, `min-h-[44px]`

**Linha de lançamento (anatomia — mobile):**

```
[Badge Tipo] Descrição da transação          R$ 1.234,56
             Categoria · dd/mm/aaaa · [Pill Conta]
```

- Badge Tipo: `text-xs font-medium rounded-full px-2 py-0.5`. ENTRADA: `bg-positive/10 text-positive`. SAÍDA: `bg-red-50 text-red-600`.
- Valor: `font-mono text-sm`. ENTRADA: `text-positive`. SAÍDA: `text-red-600`.
- Pill Conta: `text-xs rounded-full px-2 py-0.5`. CASA: `bg-casa-light text-casa`. EMPRESA: `bg-empresa-light text-empresa`.
- Toque na linha: abre Sheet de edição (mesmos campos do form de criação, pré-preenchidos).
- Swipe-to-delete (desktop: menu contextual / mobile: botão de lixeira no long-press ou ação inline): ver estado destrutivo abaixo.

**Linha de lançamento (anatomia — desktop):**

```
[Badge Tipo]  dd/mm/aaaa  Descrição                 Categoria   [Pill Conta]  R$ 1.234,56  [Editar] [Excluir]
```

- Tabela com 6 colunas; overflow-x-auto no mobile.

**Estado vazio (nenhum lançamento no mês):**
- Ícone: `ArrowLeftRight` de lucide-react, 48px, `text-text-secondary`
- Heading: "Nenhum lançamento em [mês/ano]"
- Body: "Registre o primeiro lançamento do mês usando o botão acima."
- Botão: "+ Novo lançamento" (mesmo estilo do cabeçalho)

**Filtros:**
- A lista já é filtrada por `mesSelecionado` do store Zustand.
- Filtro adicional de conta: botões toggle "Casa" / "Empresa" / "Todos" abaixo do cabeçalho, usando as cores de acento de cada conta.

### 3. Fluxo de Exclusão

**Trigger:** botão "Excluir" (ícone `Trash2` 16px, `text-red-600`) na linha desktop, ou botão "Excluir lançamento" na Sheet de edição.

**Dialog de confirmação:**
- Título: "Excluir lançamento?"
- Body: "Esta ação não pode ser desfeita. O lançamento **[descrição]** de **R$ [valor]** será removido permanentemente."
- Botão cancelar: "Manter lançamento" — variante `outline`, fecha Dialog.
- Botão confirmar: "Excluir lançamento" — variante `destructive` (`bg-red-600 text-white hover:bg-red-700`), `min-h-[44px]`.
- Loading: botão "Excluindo…" com `aria-busy="true"`.

**Fluxo especial — exclusão de pró-labore:**
- Se o lançamento faz parte de um par pró-labore, o Dialog exibe: "Este lançamento faz parte de um pró-labore. Ambos os lançamentos (saída da Empresa e entrada na Casa) serão excluídos."

### 4. Dashboard da Casa (`/visao-geral`)

**Layout:** grade de cartões. Mobile: coluna única. Desktop (≥ lg): grade 2 colunas para os 4 cartões de resumo, depois coluna única para gráficos.

**Bloco 1 — Cartões de resumo (DASH-01):**

Quatro cartões brancos com `rounded-2xl shadow-sm border border-border p-6`:

| Cartão | Label | Valor | Cor do valor |
|--------|-------|-------|--------------|
| Teto do mês | "Teto do mês" | R$ X.XXX,XX | `text-text-primary font-mono font-semibold text-2xl` |
| Total planejado | "Planejado" | R$ X.XXX,XX | `text-text-primary font-mono font-semibold text-2xl` |
| Folga | "Folga" | R$ X.XXX,XX | `text-positive` se positivo; `text-warning` se negativo; `font-mono font-semibold text-2xl` |
| Gasto até hoje | "Gasto hoje" | R$ X.XXX,XX | `text-text-primary font-mono font-semibold text-2xl` |

- Label: `text-sm text-text-secondary font-sans`
- Sem ícone nos cartões nesta fase (Fase 3 adiciona contexto de planejamento).

**Bloco 2 — Barras por categoria (DASH-02):**

Card branco com título "Para onde vai o dinheiro":
- Uma linha por categoria com gasto real.
- Estrutura por linha: `[nome da categoria] [barra de progresso] [R$ valor]`
- Barra: `h-2 rounded-full bg-border`. Preenchimento: `bg-casa`.
- Nome: `text-sm text-text-primary`
- Valor: `text-sm font-mono text-text-secondary`
- Sem dados: "Nenhum gasto registrado este mês."

**Bloco 3 — Gráfico semanal (DASH-02):**

Card branco com título "Gastos por semana":
- `BarChart` do Recharts. Deve ser Client Component (`'use client'`).
- Eixo X: "Sem 1", "Sem 2", "Sem 3", "Sem 4"
- Eixo Y: valores em R$ (usar `formatBRL()` no `tickFormatter`)
- Barra: cor `#1D4ED8` (--color-casa)
- `ResponsiveContainer width="100%" height={200}`
- Tooltip: exibe `R$ X.XXX,XX` com `font-mono`
- Sem dados: Skeleton de 200px de altura (`Skeleton` já instalado)

**Seletor de conta no dashboard:**
- Botões "Casa" / "Empresa" no topo da página, acima dos cartões.
- Esta fase só implementa a visão Casa (DASH-01, DASH-02).
- Botão "Empresa" exibe estado desabilitado com tooltip "Disponível na próxima fase." — NÃO remove o botão do DOM.
- Estado ativo "Casa": `bg-casa text-white rounded-lg px-4 min-h-[44px]`.
- Estado inativo: `bg-card text-text-secondary border border-border rounded-lg px-4 min-h-[44px]`.

**Botão "+ Novo lançamento":**
- Presente tanto em `/visao-geral` quanto em `/lancamentos`.
- Estilo: `Button` default, `min-h-[44px]`, abre o Sheet de criação de lançamento.
- No mobile do dashboard, posição: `fixed bottom-20 right-4 z-40` como FAB circular (`rounded-full w-12 h-12 shadow-lg`) com ícone `Plus` 24px (evitar cobertura pelo BottomNav de 64px + safe-area).

---

## Copywriting Contract

Todos os textos em Português do Brasil.

| Elemento | Texto |
|----------|-------|
| CTA principal — criação | "Novo lançamento" (botão cabeçalho) |
| CTA principal — FAB mobile | "+" com `aria-label="Novo lançamento"` |
| CTA submit form — criação | "Salvar lançamento" |
| CTA submit form — edição | "Salvar alterações" |
| CTA submit form — pró-labore | "Registrar Pró-labore" |
| CTA submit form — loading criação | "Salvando…" |
| CTA submit form — loading edição | "Salvando…" |
| Título Sheet — criação | "Novo lançamento" |
| Título Sheet — edição | "Editar lançamento" |
| Label campo Conta | "Conta" |
| Label campo Tipo | "Tipo" |
| Label campo Data | "Data" |
| Label campo Descrição | "Descrição" |
| Label campo Valor | "Valor" |
| Label campo Categoria | "Categoria" |
| Label campo Observação | "Observação (opcional)" |
| Helper pró-labore | "Uma única operação cria os dois lançamentos atomicamente." |
| Opção tipo pró-labore | "Pró-labore (Empresa → Casa)" |
| Label Nova categoria | "+ Nova categoria…" |
| Placeholder Nova categoria | "Nome da nova categoria" |
| Empty state lista — heading | "Nenhum lançamento em [mês abreviado/ano]" |
| Empty state lista — body | "Registre o primeiro lançamento do mês usando o botão acima." |
| Empty state barras — body | "Nenhum gasto registrado este mês." |
| Empty state dashboard — body | "Sem dados para o mês selecionado." |
| Destrutivo Dialog — título | "Excluir lançamento?" |
| Destrutivo Dialog — body | "Esta ação não pode ser desfeita. O lançamento **[descrição]** de **[valor]** será removido permanentemente." |
| Destrutivo Dialog — body pró-labore | "Este lançamento faz parte de um pró-labore. Ambos os lançamentos (saída da Empresa e entrada na Casa) serão excluídos." |
| Destrutivo Dialog — CTA cancelar | "Manter lançamento" |
| Destrutivo Dialog — CTA confirmar | "Excluir lançamento" |
| Destrutivo Dialog — loading | "Excluindo…" |
| Erro de servidor genérico | "Não foi possível salvar. Verifique sua conexão e tente novamente." |
| Erro de validação — valor inválido | "Digite um valor maior que zero." |
| Erro de validação — descrição vazia | "A descrição é obrigatória." |
| Erro de validação — categoria vazia | "Selecione uma categoria." |
| Erro pró-labore — valor zero | "Digite o valor do pró-labore." |
| Título dashboard | "Visão Geral" |
| Subtítulo bloco barras | "Para onde vai o dinheiro" |
| Subtítulo bloco gráfico | "Gastos por semana" |
| Label semanas no gráfico | "Sem 1", "Sem 2", "Sem 3", "Sem 4" |
| Tooltip "Empresa" desabilitado | "Disponível na próxima fase." |
| Folga negativa | "Passou do teto em R$ [valor]" |
| Label filtro conta | "Todos" / "Casa" / "Empresa" |
| Botão desabilitar Empresa no dashboard | "Empresa" (sem texto adicional — tooltip explica) |

---

## Interaction States

| Componente | Estado | Comportamento |
|------------|--------|---------------|
| Botão "+ Novo lançamento" | Hover | `opacity-90` |
| Botão "+ Novo lançamento" | Focus | `ring-2 ring-border ring-offset-2` |
| FAB mobile | Idle | Sombra `shadow-lg`, fundo `bg-casa text-white` |
| Linha de lançamento | Hover | `bg-bg/60` (desktop) |
| Linha de lançamento | Tap/click | Abre Sheet de edição |
| Sheet | Abertura | Desliza de baixo (mobile) / direita (desktop), `duration-200` |
| Sheet | Fundo | `SheetOverlay` opaco `bg-black/50` |
| Select campo | Focus | `ring-2 ring-border` |
| Input campo | Focus | `ring-2 ring-border` |
| Botão conta ativo (seletor) | Focus | `ring-2 ring-casa` (Casa) ou `ring-2 ring-empresa` (Empresa) |
| Botão conta ativo | — | `bg-casa text-white` (Casa) ou `bg-empresa text-white` (Empresa) |
| Botão conta inativo | — | `bg-card text-text-secondary border border-border` |
| Dialog | Abertura | `animate-in fade-in-0 zoom-in-95 duration-200` |
| Dialog overlay | — | `bg-black/50 backdrop-blur-sm` |
| Botão Excluir no Dialog | Loading | `aria-busy="true"`, texto "Excluindo…", cursor `not-allowed` |
| Skeleton dashboard | Carregando | `Skeleton` shadcn, `animate-pulse`, mesmas dimensões dos cartões |

---

## Accessibility

- `aria-label="Novo lançamento"` no FAB mobile.
- `aria-current="page"` nos links ativos (já implementado na Fase 1).
- `aria-busy="true"` em qualquer botão em estado loading.
- `aria-live="polite"` no container de mensagens de erro do formulário.
- `role="dialog"` e `aria-labelledby` gerenciados pelo shadcn `Dialog` e `Sheet` automaticamente via Radix.
- Todo campo de formulário: `<Label htmlFor={id}>` associado ao `<Input id={id}>`.
- Tabela de lançamentos desktop: `<th scope="col">` em cada coluna.
- `min-h-[44px]` em todos os elementos interativos — regra inviolável do spec.

---

## Responsive Breakpoints

| Contexto | Mobile (< 1024px) | Desktop (≥ 1024px) |
|----------|-------------------|--------------------|
| Shell | BottomNav h-16 fixo | Sidebar w-60 fixo |
| Sheet de lançamento | `side="bottom"`, altura auto, max-h-[90vh] com scroll | `side="right"`, `w-[420px]` |
| Lista de lançamentos | Linhas empilhadas (2 linhas) | Tabela horizontal 6 colunas |
| Cartões dashboard | 1 coluna | Grade 2×2 |
| Gráfico semanal | `height={180}` | `height={220}` |
| FAB | `fixed bottom-20 right-4` | Oculto — botão no cabeçalho basta |
| Tabela de lançamentos | `overflow-x-auto` | Visível inteira |

---

## Registry Safety

| Registry | Componentes usados | Safety Gate |
|----------|--------------------|-------------|
| shadcn/ui oficial (`ui.shadcn.com`) | Button, Input, Label, Card, Separator, Sheet, Skeleton (Fase 1) + Dialog, Select, Badge, Tabs (Fase 2) | Não requerido — registry oficial |

Nenhum registry de terceiros nesta fase.

---

## Rastreabilidade de Decisões

| Decisão | Fonte |
|---------|-------|
| Tokens de cor (#F3F5F7, #1D4ED8, #B45309, #0F766E, #8A3A06) | `globals.css` + `spec.md §Visual` — pré-populado |
| Fontes Manrope + IBM Plex Mono | `01-01-SUMMARY.md` — pré-populado |
| `min-h-[44px]` em todos os interativos | `spec.md §Visual` + `01-02-SUMMARY.md` — pré-populado |
| Sheet bottom/right em vez de página nova | `additional_context` — pré-populado |
| `mesSelecionado` e `contaAtiva` via Zustand | `01-01-SUMMARY.md` store/conta.ts — pré-populado |
| `formatBRL()` + `font-mono` para todos os valores | `lib/format.ts` Fase 1 — pré-populado |
| Pró-labore como terceiro Tipo no form (não tela separada) | `spec.md §Regras de cálculo` + `additional_context` — pré-populado |
| BarChart Recharts como Client Component | `01-01-SUMMARY.md` + CLAUDE.md — pré-populado |
| shadcn@4.22.0 (não latest) | `01-01-SUMMARY.md` desvios — pré-populado |
| Valores armazenados como Int centavos | `STATE.md §Key Decisions` — pré-populado |
| Entrada do campo Valor com `inputMode="decimal"` | `spec.md §Lançamento rápido` — pré-populado |
| Filtro conta com toggle "Todos/Casa/Empresa" | Inferido de LANC-04 + contaAtiva store |
| FAB como `fixed bottom-20` (acima do BottomNav h-16) | Derivado de `01-02-SUMMARY.md` layout.tsx |
| Botão Empresa no dashboard: visível porém desabilitado | Decisão de UX desta fase — evita confusion de rota inexistente |
| Cores positive/warning para folga e saldo | `globals.css` `--color-positive: #0F766E` + `--color-warning: #8A3A06` |

---

## Checker Sign-Off

- [ ] Dimensão 1 Copywriting: PASS
- [ ] Dimensão 2 Visuais: PASS
- [ ] Dimensão 3 Cor: PASS
- [ ] Dimensão 4 Tipografia: PASS
- [ ] Dimensão 5 Espaçamento: PASS
- [ ] Dimensão 6 Registry Safety: PASS

**Aprovação:** pendente
