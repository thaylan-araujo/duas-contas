# Duas Contas

## What This Is

Ferramenta web pessoal de organização financeira que separa rigorosamente duas contas: **Casa** (orçamento doméstico) e **Empresa** (negócio no Simples Nacional com canais de afiliados Shopee/Shein via grupos de WhatsApp e anúncios no Meta). Começou como uso pessoal do Thaylan, mas foi projetada para poder evoluir para outros usuários. Interface em português do Brasil, valores em R$ (formato 1.234,56) e datas em dd/mm/aaaa.

## Core Value

A Casa e a Empresa nunca se misturam — dinheiro só passa de uma para outra como pró-labore, registrado como transferência explícita.

## Context

- O usuário já tem uma rotina financeira definida (mercado semanal R$ 250 × 3, compra do mês R$ 1.000, combustível R$ 100 × 4, lazer R$ 150 × 4) e quer acompanhar semana a semana.
- A empresa tem dívidas ativas: Pronampe (Itaú) e Parcelamento do Simples (iniciado out/2026, 1ª parcela paga).
- Canais da empresa: Dicas da Liz (Shopee, casa/decoração), Achadinhos da Mel (Shein, moda), Infoproduto (em breve).
- DAS do Simples Nacional vence todo dia 20.
- Design já definido: fundo cinza-claro #F3F5F7, cartões brancos, azul para Casa (#1D4ED8), laranja para Empresa (#B45309), fontes Manrope + IBM Plex Mono.
- Telas de referência em `telas-duas-contas.pdf`.
- Especificação completa em `spec.md` — fonte de verdade para regras de negócio.

## Constraints

- **Idioma**: Português do Brasil em toda a interface — textos, labels, mensagens de erro.
- **Formato**: Valores em R$ 1.234,56; datas em dd/mm/aaaa.
- **Banco**: Supabase (Postgres) desde a Etapa 1, com Prisma como ORM.
- **Frontend**: Next.js + TypeScript + Tailwind CSS.
- **Deploy**: Vercel desde o início; sem fase "só local".
- **Mobile**: PWA instalável; botões com no mínimo 44 px de altura.
- **Separação de contas**: regra de negócio inviolável — Casa e Empresa nunca se misturam diretamente.

## Requirements

### Validated

(Nenhum ainda — publicar para validar)

### Active

- [ ] Usuário pode criar, editar, excluir e listar lançamentos por conta e mês
- [ ] Usuário pode registrar transferências (pró-labore) entre Empresa e Casa
- [ ] Usuário pode definir teto do mês e planejar gastos por categoria e semana
- [ ] Usuário pode acompanhar quanto já gastou em cada semana versus o planejado
- [ ] Usuário pode cadastrar contas fixas que entram automaticamente no plano do mês
- [ ] Usuário pode cadastrar gastos anuais (IPVA, licenciamento) divididos em 12
- [ ] Usuário pode criar metas de poupança com barra de progresso
- [ ] Usuário pode registrar comissões e anúncios por canal da empresa
- [ ] Usuário pode ver fluxo de caixa projetado da empresa (3 a 6 meses) com alerta de saldo negativo
- [ ] Usuário pode acompanhar dívidas (Pronampe, Simples) com barra de progresso e registrar pagamentos
- [ ] Usuário pode ver calendário de vencimentos com alertas (3 dias antes e no dia)
- [ ] Usuário pode gerar relatório mensal e baixar em PDF
- [ ] Usuário pode importar extratos CSV/OFX com regras automáticas de categorização
- [ ] Usuário pode usar no celular via PWA com tela de lançamento rápido

### Out of Scope

- Modo escuro — pode ser adicionado numa etapa futura
- App nativo (iOS/Android) — PWA é suficiente
- Chat em tempo real — não é core
- Login OAuth (Google/GitHub) — senha simples para uso pessoal basta por ora
- Multi-empresa — começa com uma empresa só
- Notificação via WhatsApp — calendário menciona "futuramente"

## Key Decisions

| Decisão | Racional | Resultado |
|---------|----------|-----------|
| Supabase + Prisma desde a Etapa 1 (em vez de SQLite local) | Usuário quer rodar online desde o início na Vercel; evita migração posterior | — Pendente |
| Next.js + TypeScript | Uma base só para telas e servidor; suporte nativo a Vercel | — Pendente |
| PWA em vez de app nativo | Uso no celular sem publicar em loja; custo zero | — Pendente |
| Projeto começa pessoal, pensado para evoluir | Arquitetura não precisa de multi-tenant no MVP, mas não deve impedir essa evolução | — Pendente |

## Evolution

Este documento evolui a cada transição de fase e marco de milestone.

**Após cada transição de fase** (via `/gsd-transition`):
1. Requisitos invalidados? → Mover para Out of Scope com motivo
2. Requisitos validados? → Mover para Validated com referência da fase
3. Novos requisitos? → Adicionar em Active
4. Decisões a registrar? → Adicionar em Key Decisions
5. "What This Is" ainda preciso? → Atualizar se derivou

**Após cada milestone** (via `/gsd-complete-milestone`):
1. Revisão completa de todas as seções
2. Core Value ainda é a prioridade certa?
3. Auditar Out of Scope — motivos ainda válidos?
4. Atualizar Context com estado atual

---
*Última atualização: 28/10/2026 — inicialização do projeto*
