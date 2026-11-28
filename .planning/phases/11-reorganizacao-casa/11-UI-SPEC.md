# Phase 11 — UI-SPEC: Reorganização da navegação da Casa

**Status:** Approved (estrutura confirmada pelo Thaylan em 27/11/2026)
**Plataforma:** PWA mobile-first; ≥44px; pt-BR; R$/datas via `src/lib/format.ts`. Reusar shadcn/ui + tokens existentes.

## Menu da Casa (novo) — Sidebar + BottomNav
Casa = **Visão Geral · Lançamentos · Metas**. Removidos do menu: **Planejamento**, **Contas fixas e metas**.
(Contexto empresa — Canais/Consolidado/Dívidas — inalterado.)

## 1. Visão Geral (só-leitura — nenhuma ação que muda dado)
Blocos (todos read-only):
- **Hero "posso gastar ainda"** (HeroPossoGastar — já é read-only).
- **Resumo Contas fixas**: lista com pílula de status (pago/em aberto), vencimento, valor/"a definir". **Sem**
  botões "gerar contas do mês" / "marcar pago" (versão só-leitura do ContasFixasBloco). Linka pra aba de edição.
- **Variável da semana + tetos**: acompanhamento (gasto vs teto) read-only (GastoSemanalAuto + CategoriaTetoList em modo leitura — sem editar teto).
- **Renda familiar por origem** (já existe).
- Gráficos/cards existentes (DashboardCards, gráfico semanal).
- Remover: editor inline do "dinheiro do mês"/teto, qualquer botão de ação.

## 2. Lançamentos (hub de edição — abas)
Abas (shadcn Tabs; mobile-friendly; estado via `?aba=` para deep-link/voltar):
- **Lançamentos** — a lista atual + criar/editar/excluir (TransactionSheet com status/vencimento). É a aba default.
- **Contas fixas** — CRUD de FixedAccount (com toggle `isVariableAmount`), **"Gerar contas do mês"**,
  **"Marcar pago"** (o ContasFixasBloco interativo migra pra cá), lista do mês com status.
- **Tetos & categorias** — definir tetos por categoria (o "editar" do antigo Planejamento) + gerenciar categorias.
  (Pode ser 3ª aba ou seção — discrição do builder.)

## 3. Metas (item próprio — rota `/metas`)
- Metas e reservas (Reserva de emergência, caixinha do carro…) — o bloco de metas que hoje vive em "Contas fixas e metas".
- CRUD de meta + barra de progresso + "guardar por mês" (reaproveita o que existe).

## Rotas / redirecionamento
- `/planejamento` e `/contas-fixas` saem do menu. As URLs antigas **redirecionam** (ou viram sub-rotas de `/lancamentos`):
  acompanhamento → `/visao-geral`; tetos/contas-fixas → `/lancamentos?aba=...`; metas → `/metas`. Sem link quebrado.

## Interações / acessibilidade
- Abas: alvo ≥44px, estado ativo claro, teclado/leitor de tela (Radix Tabs já cobre).
- Visão Geral: nenhum controle interativo que altere dado (links de navegação são ok, levando à aba de edição).

## Fora do contrato (builder decide)
- Redirect 308 × sub-rota; 3ª aba × seção; animações; layout fino. Nada de redesign visual novo (adiado).
