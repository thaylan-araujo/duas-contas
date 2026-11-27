# Phase 10 — UI-SPEC: Casa "Pago e A Pagar"

**Status:** Approved (deriva do mockup aprovado pelo Thaylan em 27/11/2026)
**Mockup:** `.superpowers/brainstorm/.../casa-mes.html`
**Plataforma:** PWA mobile-first; botões ≥ 44px; pt-BR; R$ 1.234,56; dd/mm/aaaa; formatação só via `src/lib/format.ts`.

## Design system
- Reusar o design system existente (shadcn/ui + tokens Tailwind v4 do `globals.css`). Nada de biblioteca nova.
- Acentos: **Casa = azul** (token existente `--casa`), **pago = verde**, **em aberto = âmbar/laranja**.
- Cartões arredondados (radius ~18px), sombra leve, tipografia Manrope (já no projeto).

## Telas / blocos (upgrade da Casa — Visão Geral e/ou Planejamento; rota final = discrição do builder)

### 1. Hero "posso gastar" (card de destaque)
- Fundo azul (gradiente casa). Rótulo "Posso gastar ainda" + valor grande (`formatBRL`).
- Barra de **% comprometido** (comprometido / dinheiro do mês).
- Linha de apoio: "X% do mês comprometido · dinheiro do mês R$ … (pró-labore)".
- 3 chips: **Contas fixas** (total), **Variável gasto**, **Já pago**.
- Estados: comprometido ≥ 100% → barra/realce de alerta (vermelho) e valor negativo em "posso gastar".

### 2. Bloco "Contas fixas"
- Cabeçalho: título + resumo ("R$ total · N em aberto").
- Linhas: ícone · nome · vencimento (dd/mm) · valor **ou** "a definir" (com estimativa discreta) · **pílula de status** (pago/em aberto) · ação **"marcar pago"** (botão ≥44px; nas "a definir" abre input de valor real).
- Ordenação sugerida: em aberto primeiro (por vencimento), depois pagos. (ajuste = builder)

### 3. Bloco "Variável — esta semana"
- Teto da semana (R$ 500) + barra do gasto; "restam R$ …".
- Tetos por categoria (linhas compactas gasto/limite) — reusa o acompanhamento atual.

## Componentes novos/alterados
- Pílula de status (`pago`/`em aberto`) — componente reutilizável.
- Botão "marcar pago" + mini-form de valor (para "a definir") — pode ser Dialog/Sheet shadcn já usado no projeto.
- Toggle "pago / em aberto" + campo "vencimento" no `TransactionSheet` (formulário de lançamento).
- Ação/botão "gerar contas do mês" (ou disparo intencional) — UX discreta.

## Interações / acessibilidade
- Marcar pago: feedback imediato (otimista) + atualização do hero.
- Toque: alvos ≥ 44px; contraste AA nas pílulas.
- Vazios: sem contas fixas → convite a cadastrar em `/contas-fixas`; sem em aberto → "tudo pago ✓".

## Fora do contrato (builder decide)
- Rota exata de cada bloco; animações; ordenação fina; onde o botão "gerar contas do mês" aparece.
