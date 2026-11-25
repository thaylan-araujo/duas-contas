# Design — Multi-Empresa e Renda Familiar

**Data:** 25/11/2026 · **Autor:** Thaylan + Claude
**Status:** proposto (aguardando aprovação)
**Relacionado:** `.planning/phases/03-planning/03-CONTEXT.md` (Ideias Adiadas), `spec.md`, `.planning/ROADMAP.md`

## Intenção e porquê

Generalizar o Duas Contas de **"Casa vs 1 Empresa"** para **"Casa + N empresas independentes"**. O Thaylan tem hoje **3 empresas distintas**, cada uma com faturamento, impostos, custos e lucro próprios, e de cada uma ele tira um pró-labore:

- **Elite Juris** (jurídico) — receita de **recorrência de clientes + projetos pontuais**.
- **Achadinhos** (afiliado) — receita de **comissões** (Shopee/Shein); custo forte em **anúncios (Meta)**.
- **Infoproduto** — **vendas** de infoprodutos; custos de **plataforma, imposto, investimento**.

**Dor central:** enxergar "quanto está sobrando" — por empresa, consolidado das 3, e o que chega na família depois dos pró-labores — além de reserva/caixinhas e projeção dos próximos meses. O modelo atual (uma empresa só) não representa isso.

## Fluxo-alvo

```
Elite Juris ─┐
Achadinhos  ─┤  cada uma: receitas − custos categorizados = lucro  →  pró-labore
Infoproduto ─┘                                                          │
                     [Consolidado das 3]                                ▼
                                                 RENDA FAMILIAR (soma dos pró-labores)
                                                  − Gastos da família
                                                  = Sobra + Caixa + caixinhas (metas/reserva)
```

A **regra de ouro se generaliza**: dinheiro só chega na família como **pró-labore** — agora vindo de **3 fontes**. Nenhuma empresa se mistura com a Casa nem **entre si**.

## Objetivos

1. Cada empresa tem **sua própria tela** e **P&L próprio** (receitas − custos categorizados = lucro).
2. Modelo de P&L **único e flexível**: cada empresa exibe só os campos que fazem sentido (afiliado mostra comissões/anúncios/ROAS; jurídico mostra recorrência+projetos; infoproduto mostra vendas/plataforma).
3. **Consolidado das 3** — quanto geram juntas.
4. **Pró-labore de cada empresa cai automaticamente na renda familiar** (transferência explícita, reutilizando o conceito de pró-labore já existente).
5. **Visão geral da família:** renda familiar − gastos = quanto sobra; **caixa** e **cada caixinha de investimento** (metas/reserva já construídas na Fase 3).
6. **Projeção** de quanto vai sobrar (empresa e/ou família) nos próximos 3–6 meses, com alerta de saldo negativo.

## Não-objetivos (adiados para o final)

- **Logins separados** por pessoa (multiusuário) — por enquanto **um usuário só**.
- **Orçamento individual por pessoa** (Thaylan × Ligiane) — adiado para o fim.

## Anti-objetivos (o que seria um fracasso)

- Forçar as 3 empresas num formulário rígido igual (ex.: campos de afiliado/ROAS aparecendo na Elite Juris).
- Qualquer mistura de dinheiro entre Casa e empresa, ou entre empresas, fora do pró-labore explícito.

## Restrições

- Stack atual (Next.js 15, Prisma/Supabase, Tailwind v4, shadcn, Recharts). pt-BR, R$ 1.234,56, dd/mm/aaaa, dinheiro em centavos (Int).
- **Fase 3 (Casa) já construída** — as metas/caixinhas e o conceito de renda/gastos da Casa são reaproveitados como base da "renda familiar".
- O modelo de dados atual usa um enum `ContaType` = CASA/EMPRESA. Precisa virar **Casa + uma entidade Empresa real (N negócios)** — migração que toca lançamentos, categorias e o seletor de conta.

## Abordagens consideradas

- **(A) Redesenhar a Empresa do roadmap para já nascer multi-empresa — ESCOLHIDA.** A Fase 4 ainda não foi construída; reescrevê-la como multi-empresa evita construir a versão de 1 empresa e refazer. Dívidas, fluxo de caixa e vencimentos passam a ser **por empresa**.
- **(B) Milestone novo (v2) depois do v1 — rejeitada.** Construiria a Fase 4 de 1 empresa e jogaria fora depois (desperdício).
- **(C) Fase de fundação separada — variação de (A).** Isolar a mudança de modelo de dados numa fase própria antes das telas; decidir no planejamento.

## Reorganização proposta do roadmap

Substituir a atual **"Fase 4: Empresa"** (1 empresa) por um bloco multi-empresa. Forma sugerida (refinar no planejamento):

1. **Fundação multi-empresa:** modelo de dados Casa + N Empresas (migrar `ContaType` → entidade Empresa; seletor "Casa + empresas"); CRUD de empresas.
2. **P&L por empresa:** receitas e custos categorizados, faturamento bruto/líquido/lucro, tela de cada empresa com campos flexíveis por tipo de negócio.
3. **Pró-labore multi-origem → renda familiar:** generalizar a transferência de pró-labore (de cada empresa para a família) + visão geral da família (renda − gastos + caixa + caixinhas).
4. **Consolidado + projeção:** visão consolidada das 3 + projeção de caixa (quanto sobra, 3–6 meses) com alerta de saldo negativo.

Dívidas (Pronampe, Simples parcelado) e DAS/vencimentos tornam-se **por empresa** (dobrados dentro dos itens acima). As fases seguintes (Calendário, Relatório, Importação, PWA) deslocam para depois, cientes de múltiplas empresas. **Cauda adiada:** multiusuário + orçamento por pessoa.

## Decisões de arquitetura (minhas, resolvidas nesta revisão)

Estas são escolhas de construção que eu decidi para não travar o desenho (o Thaylan pode sobrepor qualquer uma):

- **Casa continua um conceito próprio, separado das empresas.** A Casa tem orçamento/semanas/metas (coisas que empresa não tem); as empresas têm P&L (coisas que a Casa não tem). O seletor é "Casa + [empresas]", mas os modelos por baixo são distintos — isso cumpre o anti-objetivo de não vazar campos de afiliado/ROAS para a Elite Juris.
- **Empresas são criáveis pelo usuário (CRUD), não fixas em 3.** Cada empresa tem um **tipo/natureza** que liga módulos opcionais (ex.: "anúncios/ROAS" para afiliado). O P&L base (receitas − custos categorizados) é único; os módulos específicos aparecem conforme o tipo.
- **Renda familiar é uma visão derivada sobre a Casa, não uma camada nova.** Cada pró-labore é uma transferência (reutiliza o par de pró-labore já existente) com um campo de **empresa de origem**; a renda familiar é a soma dessas entradas. Reaproveita e estende o dashboard da Casa da Fase 3 — não recria.
- **Projeção em dois níveis:** motor de projeção por empresa + agregador consolidado por cima; o "quanto sobra" da família usa as entradas de pró-labore e os gastos da Casa. Alerta de saldo negativo nos dois níveis.
- **Migração de dados com backup obrigatório — e simples.** O Thaylan confirmou que **não há lançamentos na Empresa ainda** (lado Empresa vazio). Então a mudança `ContaType` → entidade Empresa é um recomeço limpo do lado Empresa, com backup antes (regra do CLAUDE.md) e sem necessidade de mapear dados antigos. Os dados da Casa (Fase 2/3) são preservados.

## O que fica para o planejamento / decisão do Thaylan

Itens em aberto que mudam o que será construído e devem ser resolvidos no planejamento de cada fase (alguns só o Thaylan decide):

- **Regime tributário por empresa** — todas no Simples/DAS, ou a Elite Juris é diferente? Afeta a modelagem de impostos/vencimentos.
- **Dívidas** — qual empresa é dona do Pronampe e do Parcelamento do Simples.
- **Mecânica do pró-labore** — como "aplicar" funciona: valor fixo mensal por empresa, % do lucro, ou ação manual mês a mês?
- **Conteúdo exato da tela de renda familiar** e do consolidado.
- **"Canais/ROAS"** — passa a ser um recurso específico da Achadinhos (e de quem roda anúncio), não global.
