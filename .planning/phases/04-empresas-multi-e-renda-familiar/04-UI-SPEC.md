---
phase: 4
slug: empresas-multi-e-renda-familiar
status: draft
shadcn_initialized: true
preset: "shadcn style default (Radix UI) — herdado das Fases 1/2/3"
created: 2026-11-25
fatia: "1 de 4 — Fundação multi-empresa"
---

# Phase 4 — UI Design Contract: Fundação multi-empresa (Fatia 1)

> Contrato visual e de interação para a **fundação** do bloco multi-empresa: o **seletor dropdown no topo**
> "Casa + empresas" (substitui o toggle Casa/Empresa), o **CRUD de empresas** (criar/editar/remover, com
> proteção na exclusão) e a **gestão de categorias de receita/custo por empresa**.
> Gerado por gsd-ui-researcher. Verificado por gsd-ui-checker.
> **Escopo desta fatia (Phase Boundary do 04-CONTEXT):** somente a fundação. **Fora de escopo:** P&L por
> empresa, pró-labore→renda familiar, consolidado, projeção, dívidas, impostos/DAS. Essas telas têm suas
> próprias rodadas de discussão e UI-SPEC.

**Reaproveita integralmente** o contrato visual das Fases 2 e 3 (`02-UI-SPEC.md`, `03-UI-SPEC.md`): tokens de
cor, tipografia, escala de espaçamento, padrões de `Sheet`/`Dialog`/`Card`/`Select`/`Table`, regra
`min-h-[44px]`, `formatBRL()` + `font-mono` para valores, `formatDate()` + `font-sans` para datas, edição
inline por blur/Enter, o padrão "add-card" tracejado para criar, e o padrão de proteção na exclusão
(D-08 da Fase 2). Este documento especifica **apenas o que a Fatia 1 adiciona**; onde um padrão já foi
fixado nas Fases 2/3, apenas o referenciamos.

---

## Referência de Design (telas-duas-contas.pdf)

Fonte visual de verdade: `design/telas-duas-contas.pdf`. Para esta fatia, o PDF fornece **a linguagem visual
geral** e a **identidade laranja da Empresa** (telas 5/6). O detalhe de P&L dessas telas está **fora de
escopo**; use-as apenas para: (1) a cor-acento de empresa padrão (`#B45309`/`#FDEBD8`) e (2) a consistência de
cartões brancos, cabeçalhos e espaçamento. O **dropdown multi-empresa** e as telas de **CRUD de empresa** não
aparecem no PDF (são novos nesta evolução) — herdam os padrões de Sheet/Dialog/Table/add-card das Fases 2/3.

---

## Design System

| Propriedade | Valor |
|-------------|-------|
| Ferramenta | shadcn/ui (style "default", `components.json` já presente) |
| Preset | estilo "default" — herdado das Fases 1/2/3 (não reinicializar) |
| Biblioteca de componentes | Radix UI (via shadcn) |
| Biblioteca de ícones | lucide-react |
| Fonte da interface | Manrope via `--font-sans` |
| Fonte dos números | IBM Plex Mono via `--font-mono` |

**Fonte:** `components.json` + `globals.css` + `02-UI-SPEC.md` + `03-UI-SPEC.md`.

**Componentes shadcn já instalados (Fases 1–3):** Button, Input, Label, Card, Separator, Sheet, Skeleton,
Dialog, Select, Badge, Tabs, Checkbox, Switch, Progress, Table. (Verificado em `src/components/ui/`.)

**Novos componentes shadcn necessários nesta fatia:**
- `DropdownMenu` — o seletor "Casa + empresas" no topo (menu com item por conta/empresa + separador + ações
  "Gerenciar empresas"). É do registry oficial shadcn — sem gate de terceiros.

> Nenhum outro componente novo é necessário: o CRUD de empresa reutiliza `Sheet` (form) + `Dialog`
> (confirmação de exclusão), e a gestão de categorias reutiliza o padrão "Gerenciar categorias" da Fase 2
> (Select com "+ Nova categoria…" / lista editável + add-card). A trigger do dropdown pode ser um `Button`
> `variant="ghost"` estilizado em vez do `DropdownMenuTrigger` padrão.

---

## Spacing Scale

Escala de 4 pontos. Herdada das Fases 2/3 sem alterações. Fonte: `spec.md §Visual` + padrão shadcn/ui.

| Token | Valor | Uso nesta fatia |
|-------|-------|-----------------|
| xs | 4px | Gap entre o ponto/avatar de cor da empresa e seu nome; gap ícone↔texto inline |
| sm | 8px | Padding interno dos itens do dropdown; gap entre swatch de cor e label; gap label↔campo no Sheet |
| md | 16px | Padding interno de Card; espaçamento entre campos do Sheet de empresa; gap entre linhas da lista de empresas |
| lg | 24px | Padding horizontal de Sheet/Dialog; gap entre as seções (lista de empresas / categorias da empresa) |
| xl | 32px | Gap entre a grade de cartões de empresa e o bloco de categorias |
| 2xl | 48px | Separador entre header da página e conteúdo |
| 3xl | 64px | Não usado nesta fatia |

**Exceções:**
- Todos os botões, campos, o **gatilho do dropdown no topo** e cada **item do dropdown**: alvo de toque
  `min-h-[44px]` (regra inviolável do spec — o seletor precisa ser confortável no topo mobile).
- Swatch/ponto de cor da empresa no dropdown e na lista: `h-3 w-3` (12px) `rounded-full`, meramente decorativo
  (`aria-hidden`), com o nome textual sempre ao lado.
- Espaço seguro inferior/superior do shell: inalterado (herdado da Fase 1).

---

## Typography

Herdada das Fases 2/3 sem alterações. Fonte: `spec.md §Visual` + `globals.css` + `02-UI-SPEC.md`.

| Papel | Tamanho | Peso | Line-height | Fonte | Uso nesta fatia |
|-------|---------|------|-------------|-------|-----------------|
| Display (valor monetário) | 24px (`text-2xl`) | 600 (semibold) | 1.2 | IBM Plex Mono (`font-mono`) | Não há valores grandes próprios da Fatia 1 (P&L é fora de escopo); reservado para consistência |
| Heading de seção | 20px (`text-xl`) | 600 (semibold) | 1.2 | Manrope (`font-sans`) | Título "Empresas", título do Sheet de empresa, título do card "Categorias da empresa" |
| Body | 16px (`text-base`) | 400 (regular) | 1.5 | Manrope (`font-sans`) | Nome da empresa na lista/dropdown, labels de campo, nome de categoria |
| Label / Metadado | 14px (`text-sm`) | 400 (regular) | 1.4 | Manrope (`font-sans`) | Tipo da empresa (descritor), rótulo "Casa" no dropdown, texto de ajuda |

> **12px (`text-xs`)** — reservado a pills/badges de tipo de empresa e ao eyebrow de página, reutilizando as
> classes já em uso (Sidebar/BottomNav). Não redeclarar aqui.

**Pesos em uso nesta fatia: 400 (regular) e 600 (semibold) — máximo 2 pesos.**

**Regras herdadas:** toda string formatada por `formatBRL()` usa `font-mono`; rótulos textuais usam `font-sans`.

---

## Color

Herda a paleta das Fases 2/3. **A única adição conceitual é a identidade de cor por empresa** — o seletor
precisa dar a cada empresa uma cor própria (como o azul identifica a Casa). Fonte: `globals.css` + `spec.md §Visual` + `04-CONTEXT D-03/D-06`.

| Papel | Hex | Token CSS | Uso nesta fatia |
|-------|-----|-----------|-----------------|
| Dominante (60%) | `#F3F5F7` | `bg-bg` | Fundo da página, fundo dos campos |
| Secundário (30%) | `#FFFFFF` | `bg-card` | Cartões de empresa, menu do dropdown, Sheet, Dialog, linhas da lista |
| Borda | `#E3E7EC` | `border-border` | Bordas de cartão, dividers da lista, borda do gatilho do dropdown |
| Texto principal | `#0F1B2D` | `text-text-primary` | Nome da empresa, labels, item ativo do dropdown |
| Texto secundário | `#5B6675` | `text-text-secondary` | Tipo da empresa, texto de ajuda, placeholder |
| Acento Casa | `#1D4ED8` / `#DCEBFF` | `text-casa` / `bg-casa` / `bg-casa-light` | Identidade da conta **Casa** no dropdown e quando Casa é o contexto ativo |
| Acento Empresa (padrão) | `#B45309` / `#FDEBD8` | `text-empresa` / `bg-empresa` / `bg-empresa-light` | **Cor-padrão** de empresa nova quando o usuário não escolhe outra; mantém a identidade laranja do spec |
| Destrutivo | `#DC2626` | Tailwind `red-600` | Botão "Excluir empresa" no Dialog de confirmação; estado destrutivo |
| Positivo | `#0F766E` | `text-positive` | Reservado (não essencial à Fatia 1) |
| Atenção | `#8A3A06` | `text-warning` | Mensagem de bloqueio ao tentar excluir empresa com lançamentos |

### Paleta de cores de empresa (nova — determinística, não arbitrária)

Cada empresa escolhe **uma** cor no cadastro (D-03), usada como identidade dela no dropdown, na lista e no
contexto ativo. Para não deixar o executor inventar hexes, a cor é escolhida de uma **paleta fixa de 6 opções**
(cor-acento + fundo claro par). A cor da **Casa é fixa** (azul `#1D4ED8`) e **não** faz parte da paleta de empresa.

| Nome (label no seletor de cor) | Acento | Fundo claro (pill/estado ativo) | Observação |
|--------------------------------|--------|---------------------------------|------------|
| Laranja (padrão) | `#B45309` | `#FDEBD8` | Reutiliza o token `empresa`; cor-padrão de empresa nova (D-03) |
| Verde | `#0F766E` | `#D7EFE9` | Reutiliza o token `positive` como acento categórico |
| Roxo | `#6D28D9` | `#EDE4FD` | Novo tom de apoio |
| Rosa | `#BE185D` | `#FBE0ED` | Novo tom de apoio |
| Âmbar | `#A16207` | `#FBEFD0` | Novo tom de apoio |
| Cinza-azulado | `#475569` | `#E2E8F0` | Neutro — bom para empresa "Genérica" |

> **Regras de cor por empresa:**
> 1. As três empresas do seed (D-05) recebem cores distintas e estáveis: **Elite Juris → Cinza-azulado**
>    (jurídico, sóbrio), **Achadinhos → Laranja** (afiliado, cor-padrão), **Infoproduto → Roxo**.
> 2. A cor da empresa aparece **sempre** como um swatch/ponto `rounded-full` + o **nome textual ao lado**
>    (cor nunca é o único sinal — regra de a11y); o swatch é `aria-hidden`.
> 3. O **estado ativo** (empresa selecionada no dropdown) usa o par fundo-claro + acento daquela empresa
>    (ex.: `bg-[#FDEBD8] text-[#B45309]`), espelhando o `bg-casa-light text-casa` da Casa.
> 4. Essas cores são **tons de identidade de conta** e contam dentro dos 10% de acento — nunca aplicá-las a
>    texto de corpo corrido, apenas a swatch, estado ativo do dropdown, pill de empresa e borda de contexto.
> 5. Implementação: as 6 cores entram como tokens no `@theme` do `globals.css` (ex.:
>    `--color-empresa-verde`, `--color-empresa-verde-light`, …) para evitar classes de hex arbitrário em JSX;
>    o par Laranja reutiliza os tokens `empresa`/`empresa-light` existentes. Decisão de implementação exata
>    (tokens vs mapa TS) fica a critério do executor, desde que a paleta seja a fixa acima.

**Regra de split 60/30/10 (herdada):** Fundo + campos (60%) → cartões brancos + Sheets/Dialog/menu (30%) →
cor de conta (Casa azul ou cor da empresa) + destrutivo (10%).

---

## Componentes desta Fatia

### 1. Seletor dropdown "Casa + empresas" no topo (D-06 — substitui o toggle Casa/Empresa)

Substitui o `AccountSelector.tsx` atual (botões Casa ativo / Empresa desabilitado) por um **dropdown** que
troca o **contexto ativo** de todas as telas. O store `useContaStore` passa a representar
`{ tipo: 'CASA' } | { tipo: 'EMPRESA', empresaId }` (D-06; forma exata no planejamento).

**Posicionamento:**
- **Desktop (≥ lg):** no topo da área de conteúdo (onde hoje vive o `AccountSelector` da `/visao-geral`), e/ou
  no topo da Sidebar abaixo do nome "Duas Contas". Decisão de layout exato a critério do planejamento, mas o
  dropdown é **global** (visível em todas as telas authed), não só na visão geral.
- **Mobile (< lg):** no **topo da barra superior** do shell (a barra que, no mobile, substitui a Sidebar).
  Alvo de toque `min-h-[44px]`, largura confortável para o polegar.

**Gatilho (trigger):** `Button variant="ghost"` com:
`[swatch da cor do contexto ativo] [nome do contexto ativo] [ícone ChevronDown 16px]`.
- Contexto = Casa: swatch `bg-casa`, nome "Casa", texto `text-text-primary`.
- Contexto = empresa X: swatch na cor da empresa, nome da empresa.
- `min-h-[44px]`, borda `border border-border rounded-lg`, `px-3`, `gap-2`.

**Menu aberto (`DropdownMenuContent`):**
- Largura mínima `w-56`, `bg-card`, `rounded-xl border border-border shadow-md`, `p-1`.
- **Item "Casa"** primeiro: `[swatch bg-casa] Casa`. Item ativo recebe `bg-casa-light text-casa`.
- **Separator** (`DropdownMenuSeparator`).
- **Um item por empresa**, em ordem de criação: `[swatch cor da empresa] Nome da empresa`
  + descritor do tipo em `text-xs text-text-secondary` à direita ou abaixo (ex.: "Afiliado"). Item ativo
  recebe o par fundo-claro/acento da empresa.
- **Separator**.
- **Ação de rodapé:** item "Gerenciar empresas" com ícone `Settings` 16px → navega para a tela de CRUD de
  empresas (seção 2). (Não é um contexto; é uma ação.)
- Cada item `min-h-[44px]`, `rounded-lg`, `gap-2`, hover `bg-bg/60`.

**Comportamento:**
- Selecionar um item (Casa ou empresa) atualiza `contaAtiva` no store e **fecha** o menu; todas as telas
  passam a filtrar por esse contexto. O `mesSelecionado` é preservado (não reseta ao trocar de contexto).
- O item do contexto ativo exibe um ícone `Check` 16px à direita (além do realce de cor).
- Sem empresas cadastradas (estado improvável pós-seed, mas possível após remover todas): o menu mostra só
  "Casa" + separador + "Gerenciar empresas", e abaixo o texto `text-sm text-text-secondary`
  "Nenhuma empresa ainda. Crie a primeira em Gerenciar empresas.".

### 2. Tela / seção "Empresas" — CRUD (D-03)

Tela de gestão das empresas (rota sugerida `/empresas`, acessada via "Gerenciar empresas" do dropdown).
Server Component que lista as empresas do usuário.

**Cabeçalho:**
- Eyebrow "EMPRESA" (`text-xs font-semibold uppercase tracking-wide text-text-secondary`) acima do título
  **"Empresas"** (`text-xl font-semibold text-text-primary`).
- CTA **"+ Nova empresa"** à direita (`Button` default, `min-h-[44px]`, ícone `Plus` 16px).

**Lista de empresas (grade de cartões):**
- Grade de `Card` brancos (`rounded-2xl border border-border p-4`). Desktop: 2–3 colunas; mobile: 1 coluna.
- **Anatomia do cartão de empresa:**
  - Topo: `[swatch/ponto da cor, 12px] Nome da empresa` (`text-base font-semibold`) + **pill de tipo**
    (`text-xs rounded-full px-2 py-0.5` na cor da empresa: `bg-{empresa-light} text-{empresa}`) — ex.: "Afiliado".
  - Linha de ações (no hover/toque): `Pencil` 16px ("Editar empresa") + `Trash2` 16px `text-red-600`
    ("Excluir empresa").
  - Micro-link "Gerenciar categorias" (`text-sm text-{cor da empresa}`) → abre a seção/tela de categorias da
    empresa (seção 3). Opcionalmente o cartão inteiro tocável leva à mesma seção.
- **Última célula da grade:** **card tracejado "+ Nova empresa"** (`border-2 border-dashed border-border
  rounded-2xl`, centralizado, `min-h` igual aos cartões) — padrão add-card herdado da Fase 3. Abre o Sheet de
  criação.

**Sheet de criação/edição de empresa** (`Sheet` — `side="bottom"` mobile / `side="right"` `w-[420px]` desktop,
padrão herdado da Fase 2). Mesmo Sheet para criar e editar.

| Campo | Componente | Validação |
|-------|-----------|-----------|
| Nome | `Input` placeholder "Ex.: Achadinhos" | Obrigatório; máx. 60 chars |
| Tipo | `Select` — opções fixas: "Afiliado", "Jurídico/Serviços", "Infoproduto", "Genérico" (D-02) | Obrigatório; padrão "Genérico" |
| Cor | Seletor de cor: 6 swatches `rounded-full` clicáveis (paleta fixa acima), estado selecionado com `ring-2` na cor + `Check` | Obrigatório; padrão "Laranja" |

- **Nota sobre o Tipo (D-02/D-04):** o tipo determina o **conjunto de categorias padrão** semeado ao criar a
  empresa (seção 3). Texto de ajuda abaixo do campo Tipo: "O tipo define as categorias iniciais da empresa.".
  **Nenhum módulo de P&L por tipo nesta fatia** (ROAS/anúncios etc. são fatias seguintes).
- **CNPJ:** adiado (D-03) — **não** aparece no form desta fatia.
- CTA submit criação: **"Salvar empresa"**; edição: **"Salvar alterações"**; loading: **"Salvando…"** com
  `aria-busy="true"`.
- Ao criar, a empresa já nasce com o conjunto de categorias padrão do tipo (seed por getOrSeed — seção 3).

### 3. Gestão de categorias por empresa (D-04 — reaproveita o padrão "Gerenciar categorias" da Fase 2)

Cada empresa tem **suas próprias** categorias de **receita** e **custo** (não compartilhadas), semeadas por
tipo ao criar. Reutiliza o padrão de gestão de categorias da Fase 2 (lista editável + "+ Nova categoria…").

**Composição (card ou seção dentro da tela de empresa):**
- Título **"Categorias da empresa"** (`text-xl font-semibold`) + subtítulo
  "Receitas e custos usados nos lançamentos desta empresa." (`text-sm text-text-secondary`).
- **Dois grupos** lado a lado (desktop) / empilhados (mobile), cada um um bloco com seu heading:
  - **"Receitas"** — lista de categorias de receita.
  - **"Custos"** — lista de categorias de custo (ex.: imposto, funcionário, ferramentas, anúncios,
    investimento — conjunto padrão do D-04).
- Cada linha de categoria: nome (`text-base`) + ações `Pencil`/`Trash2` no hover/toque; add-card ou link
  **"+ Nova categoria"** ao final de cada grupo (padrão Fase 2).
- Edição de categoria segue o padrão inline/Sheet já fixado na Fase 2 (não reabrir Dialog para renomear).
- O accent usado nos realces desta seção é a **cor da empresa ativa** (não o azul da Casa).

**Seed de categorias por tipo (D-04 — conjunto padrão):**
- **Custos comuns a todos os tipos:** Imposto, Funcionário, Ferramentas, Anúncios, Investimento.
- **Receitas por tipo:** Afiliado → "Comissões"; Jurídico/Serviços → "Recorrência", "Projetos"; Infoproduto →
  "Vendas"; Genérico → "Receita".
- Semeado via getOrSeed re-executável ao criar a empresa (mesmo padrão do seed de metas da Fase 3 / categorias
  da Fase 2). Editável por empresa depois.

### 4. Exclusão de empresa — proteção (D-03, seguindo D-08 da Fase 2)

**Trigger:** `Trash2` no cartão de empresa, ou botão "Excluir empresa" no Sheet de edição.

**Caso A — empresa SEM lançamentos vinculados:** `Dialog` de confirmação (padrão Fase 2).
- Título: **"Excluir empresa?"**
- Body: "Esta ação não pode ser desfeita. A empresa **[nome]** e todas as suas categorias serão removidas."
- CTA cancelar: **"Manter empresa"** (`outline`, fecha o Dialog).
- CTA confirmar: **"Excluir empresa"** (`destructive` `bg-red-600 text-white hover:bg-red-700`, `min-h-[44px]`).
- Loading: **"Excluindo…"** com `aria-busy="true"`.

**Caso B — empresa COM lançamentos vinculados:** **bloquear a exclusão** (mesmo padrão de proteção das
categorias, D-08 da Fase 2). O Dialog **não** oferece o botão destrutivo; em vez disso mostra:
- Título: **"Não é possível excluir"**
- Body (em `text-warning`): "A empresa **[nome]** tem **[N]** lançamento(s) vinculado(s). Remova ou mova os
  lançamentos antes de excluir a empresa."
- CTA único: **"Entendi"** (`outline`, fecha o Dialog).

> Se o contexto ativo era a empresa excluída, após a exclusão o seletor volta automaticamente para **Casa**.

---

## Copywriting Contract

Todos os textos em Português do Brasil. CTAs são verbo + substantivo; mensagens de erro descrevem o problema e
o próximo passo.

| Elemento | Texto |
|----------|-------|
| Gatilho dropdown — contexto Casa | "Casa" |
| Gatilho dropdown — contexto empresa | "[nome da empresa]" |
| Item do dropdown — Casa | "Casa" |
| Descritor de tipo no item | "Afiliado" / "Jurídico/Serviços" / "Infoproduto" / "Genérico" |
| Ação de rodapé do dropdown | "Gerenciar empresas" |
| Dropdown sem empresas — texto | "Nenhuma empresa ainda. Crie a primeira em Gerenciar empresas." |
| Eyebrow tela empresas | "EMPRESA" |
| Título tela empresas | "Empresas" |
| CTA nova empresa (header) | "+ Nova empresa" |
| CTA add-card nova empresa | "+ Nova empresa" |
| Micro-link gerenciar categorias | "Gerenciar categorias" |
| Ação editar empresa (aria-label) | "Editar empresa" |
| Ação excluir empresa (aria-label) | "Excluir empresa" |
| Título Sheet empresa — criação | "Nova empresa" |
| Título Sheet empresa — edição | "Editar empresa" |
| Label campo Nome | "Nome" |
| Placeholder campo Nome | "Ex.: Achadinhos" |
| Label campo Tipo | "Tipo" |
| Opções do Tipo | "Afiliado" · "Jurídico/Serviços" · "Infoproduto" · "Genérico" |
| Ajuda do campo Tipo | "O tipo define as categorias iniciais da empresa." |
| Label campo Cor | "Cor" |
| Nomes das cores (seletor) | "Laranja" · "Verde" · "Roxo" · "Rosa" · "Âmbar" · "Cinza-azulado" |
| CTA submit Sheet — criação | "Salvar empresa" |
| CTA submit Sheet — edição | "Salvar alterações" |
| CTA submit Sheet — loading | "Salvando…" |
| Título card categorias | "Categorias da empresa" |
| Subtítulo card categorias | "Receitas e custos usados nos lançamentos desta empresa." |
| Grupo de categorias — receita | "Receitas" |
| Grupo de categorias — custo | "Custos" |
| CTA nova categoria | "+ Nova categoria" |
| Empty state empresas — heading | "Nenhuma empresa cadastrada" |
| Empty state empresas — body | "Crie sua primeira empresa para começar a lançar receitas e custos nela." |
| Empty state categorias (grupo vazio) | "Nenhuma categoria aqui ainda." |
| Destrutivo empresa — título | "Excluir empresa?" |
| Destrutivo empresa — body | "Esta ação não pode ser desfeita. A empresa **[nome]** e todas as suas categorias serão removidas." |
| Destrutivo empresa — CTA cancelar | "Manter empresa" |
| Destrutivo empresa — CTA confirmar | "Excluir empresa" |
| Destrutivo empresa — loading | "Excluindo…" |
| Bloqueio exclusão — título | "Não é possível excluir" |
| Bloqueio exclusão — body | "A empresa **[nome]** tem **[N]** lançamento(s) vinculado(s). Remova ou mova os lançamentos antes de excluir a empresa." |
| Bloqueio exclusão — CTA | "Entendi" |
| Erro de servidor genérico | "Não foi possível salvar. Verifique sua conexão e tente novamente." |
| Erro validação — nome vazio | "O nome é obrigatório." |
| Erro validação — nome duplicado | "Já existe uma empresa com esse nome." |
| Erro validação — tipo vazio | "Selecione um tipo." |

---

## Interaction States

Herda os estados das Fases 2/3 (Sheet, Dialog, Input/Select focus, botões, add-card). Estados novos desta fatia:

| Componente | Estado | Comportamento |
|------------|--------|---------------|
| Gatilho do dropdown | Idle | `border border-border rounded-lg bg-card`, swatch do contexto + nome + `ChevronDown` |
| Gatilho do dropdown | Hover | `bg-bg/60` |
| Gatilho do dropdown | Aberto | `ChevronDown` rotaciona 180° (`rotate-180 transition-transform`) |
| Item do dropdown | Hover | `bg-bg/60` |
| Item do dropdown — Casa ativo | — | `bg-casa-light text-casa` + `Check` 16px à direita |
| Item do dropdown — empresa ativa | — | par fundo-claro/acento da empresa + `Check` 16px à direita |
| Swatch de cor (dropdown/lista) | — | `h-3 w-3 rounded-full` na cor da conta, `aria-hidden="true"` |
| Seletor de cor (Sheet) | Selecionado | `ring-2` na cor + ícone `Check` branco centralizado no swatch |
| Seletor de cor (Sheet) | Focus | `ring-2 ring-offset-2` na cor |
| Cartão de empresa | Hover (desktop) | `bg-bg/60`; revela ações `Pencil`/`Trash2` |
| Card "+ Nova empresa" (add-card) | Idle | `border-2 border-dashed border-border`; hover `bg-bg/60`; abre Sheet de criação |
| Pill de tipo da empresa | — | `text-xs rounded-full px-2 py-0.5` no par fundo-claro/acento da empresa |
| Dialog de exclusão | Abertura | `animate-in fade-in-0 zoom-in-95 duration-200` (herdado) |
| Botão Excluir empresa | Loading | `aria-busy="true"`, texto "Excluindo…", cursor `not-allowed` |
| Linha de categoria | Hover (desktop) | `bg-bg/60`; revela `Pencil`/`Trash2` |

---

## Accessibility

Herda a base das Fases 2/3. Adições desta fatia:

- **Dropdown (`DropdownMenu` do Radix via shadcn):** `role="menu"`/`menuitem` e gestão de foco/teclado
  (setas, Enter, Esc) fornecidos pelo Radix. O gatilho tem `aria-haspopup="menu"` e `aria-expanded`.
- O **gatilho** do dropdown tem rótulo acessível que inclui o contexto atual, ex.:
  `aria-label="Conta ativa: Casa. Trocar de conta."`.
- **Swatch/ponto de cor** (dropdown, cartão, seletor de cor): `aria-hidden="true"` — a cor **nunca** é o único
  sinal; o nome textual da conta/empresa ao lado é o rótulo acessível. Isso vale também para a seleção de cor
  no Sheet (cada swatch é um `radio`/`button` com `aria-label` = nome da cor, ex.: "Cor Laranja").
- O item do contexto ativo além do realce de cor traz `Check` visível e `aria-current="true"`.
- **Seletor de cor no Sheet:** grupo `role="radiogroup"` com `<legend>`/`aria-labelledby` "Cor"; cada swatch
  `role="radio"` com `aria-checked`.
- Campos do Sheet de empresa: `<Label htmlFor>` associado a cada `Input`/`Select`.
- Mensagem de bloqueio de exclusão: além da cor `text-warning`, o texto descreve explicitamente o motivo e o
  próximo passo (cor não é o único sinal).
- `aria-live="polite"` no container de mensagens de erro do form (herdado da Fase 2).
- `min-h-[44px]` / alvo de toque ≥ 44px em: gatilho do dropdown, cada item do dropdown, todos os campos e
  botões, swatches do seletor de cor — regra inviolável do spec.

---

## Responsive Breakpoints

| Contexto | Mobile (< 1024px) | Desktop (≥ 1024px) |
|----------|-------------------|--------------------|
| Seletor "Casa + empresas" | No **topo da barra superior** do shell; gatilho full-width ou alinhado à esquerda, `min-h-[44px]`; menu abre ancorado abaixo | No topo da área de conteúdo e/ou no topo da Sidebar; menu ancorado ao gatilho |
| Menu do dropdown | Largura ≥ gatilho, itens empilhados, scroll se muitas empresas | `w-56`, ancorado ao gatilho |
| Lista de empresas | Cartões em 1 coluna + add-card ao final | Grade 2–3 colunas, add-card como última célula tracejada |
| Sheet de empresa | `side="bottom"`, `max-h-[90vh]` com scroll | `side="right"`, `w-[420px]` |
| Seletor de cor (6 swatches) | Grade 3×2, cada swatch alvo ≥ 44px | Linha única de 6 swatches |
| Categorias da empresa | Grupos "Receitas"/"Custos" empilhados | Dois grupos lado a lado |
| Dialog de exclusão/bloqueio | Centralizado, largura `max-w-[90vw]` | Centralizado `max-w-md` |

---

## Registry Safety

| Registry | Componentes usados | Safety Gate |
|----------|--------------------|-------------|
| shadcn/ui oficial (`ui.shadcn.com`) | Reutilizados das Fases 1–3: Button, Input, Label, Card, Separator, Sheet, Skeleton, Dialog, Select, Badge, Table. **Novo nesta fatia: DropdownMenu** | Não requerido — registry oficial |

Nenhum registry de terceiros nesta fatia. Gate de vetting não aplicável.

---

## Rastreabilidade de Decisões

| Decisão | Fonte |
|---------|-------|
| Tokens de cor base e fontes (todos reutilizados) | `globals.css` + `spec.md §Visual` + `02/03-UI-SPEC.md` — pré-populado |
| `min-h-[44px]` em todos os interativos (incl. gatilho e itens do dropdown) | `spec.md §Visual` — pré-populado |
| Dropdown "Casa + empresas" substitui o toggle Casa/Empresa; troca contexto global | 04-CONTEXT D-06 + `spec.md §Evolução` — pré-populado |
| `contaAtiva` passa a ser `Casa | { empresaId }`; `mesSelecionado` preservado ao trocar | 04-CONTEXT D-06 + `src/store/conta.ts` — pré-populado |
| Campos do cadastro de empresa: nome, tipo, cor (CNPJ adiado) | 04-CONTEXT D-03 — pré-populado |
| Tipos fixos: Afiliado / Jurídico-Serviços / Infoproduto / Genérico | 04-CONTEXT D-02 — pré-populado |
| Tipo determina categorias padrão semeadas (sem módulos de P&L nesta fatia) | 04-CONTEXT D-02/D-04 — pré-populado |
| Categorias de receita/custo por empresa, próprias, seed por tipo (getOrSeed) | 04-CONTEXT D-04/D-05 + padrão seed Fase 3 — pré-populado |
| Seed de 3 empresas (Elite Juris/Achadinhos/Infoproduto) com cores distintas | 04-CONTEXT D-05 — pré-populado + cores atribuídas aqui |
| Exclusão de empresa segue proteção D-08 Fase 2 (bloqueia com lançamentos) | 04-CONTEXT D-03 + Fase 2 — pré-populado |
| Cor-padrão de empresa = laranja `#B45309`/`#FDEBD8` (token `empresa`) | `spec.md §Visual` + 04-CONTEXT D-06 — pré-populado |
| Paleta fixa de 6 cores de empresa (determinística, não arbitrária) | Decisão de UI desta fatia — evita hexes inventados; estende tokens existentes |
| Padrão add-card tracejado para "+ Nova empresa" / "+ Nova categoria" | `03-UI-SPEC.md` (card "+ Nova meta") — reutilizado |
| Sheet (form) + Dialog (confirmação) para o CRUD | `02-UI-SPEC.md` padrões — reutilizado |
| DropdownMenu como único componente shadcn novo | Inferido do seletor desta fatia — registry oficial |
| Fora de escopo: P&L, pró-labore→família, consolidado, projeção, dívidas, DAS | 04-CONTEXT §Phase Boundary + Deferred — pré-populado |

---

## Checker Sign-Off

- [ ] Dimensão 1 Copywriting: PASS
- [ ] Dimensão 2 Visuais: PASS
- [ ] Dimensão 3 Cor: PASS
- [ ] Dimensão 4 Tipografia: PASS
- [ ] Dimensão 5 Espaçamento: PASS
- [ ] Dimensão 6 Registry Safety: PASS

**Aprovação:** pendente
</content>
</invoke>
