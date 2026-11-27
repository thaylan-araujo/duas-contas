# Roadmap: Duas Contas

**Project:** Duas Contas
**Core Value:** A Casa e cada empresa nunca se misturam (nem as empresas entre si) — dinheiro só chega na família como pró-labore de cada empresa, registrado como transferência explícita. (Evoluiu de 1 empresa para N empresas em 25/11/2026 — ver docs/superpowers/specs/2026-11-25-multi-empresa-renda-familiar-design.md.)
**Created:** 28/10/2026
**Mode:** mvp

---

## Phases

- [ ] **Phase 1: Foundation** - Infraestrutura, autenticação e utilitários críticos antes de qualquer feature
- [x] **Phase 2: Core CRUD** - Lançamentos, pró-labore e dashboard da Casa (completed 2026-11-24)
- [x] **Phase 3: Planning** - Orçamento mensal, cartões semanais, contas fixas e metas (completed 2026-11-25)
- [x] **Phase 3.5: Casa — Acompanhamento (rework)** - substitui o planejamento semanal manual por barra "dinheiro do mês" + tetos por categoria + gasto semanal automático; remove PlanItem/WeeklySpend (ver docs/superpowers/specs/2026-11-25-casa-acompanhamento-design.md)
- [x] **Phase 4: Empresas (multi) e Renda Familiar** - Casa + N empresas independentes (P&L por empresa), pró-labore de cada → renda familiar, consolidado + projeção, dívidas e DAS por empresa (ver docs/superpowers/specs/2026-11-25-multi-empresa-renda-familiar-design.md)
- [ ] **Phase 5: Calendário e Alertas** - Calendário de vencimentos com notificações push
- [ ] **Phase 6: Relatório Mensal** - Relatório completo e exportação em PDF
- [ ] **Phase 7: Importação CSV/OFX** - Upload de extrato com categorização automática
- [ ] **Phase 8: PWA Polish** - Mobile refinado, lançamento rápido e instalação PWA
- [ ] **Phase 9: Assistente de WhatsApp (IA)** — **PRIORIDADE ATUAL** — lançar e consultar pelo WhatsApp via Evolution API + IA (ver docs/superpowers/specs/2026-11-26-whatsapp-assistant-design.md)

---

## Phase Details

### Phase 1: Foundation

**Goal**: Deploy funcionando na Vercel com autenticação, schema Prisma correto e utilitários que previnem os três bugs críticos de infraestrutura (pooler, float money, timezone)
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02
**Success Criteria** (what must be TRUE):

  1. Usuário pode fazer login com email e senha e a sessão persiste ao recarregar o navegador
  2. A aplicação está acessível pela URL da Vercel sem erros 500 aleatórios
  3. Todos os valores monetários são armazenados como inteiros em centavos no banco (nunca Float)
  4. Datas são armazenadas como DATE no Postgres e exibidas em dd/mm/aaaa sem deslocamento de fuso horário
  5. `formatBRL()` e `formatDate()` existem como utilitários únicos e são usados em toda exibição de valores

**Plans**: 1/2 plans executed
Plans:

- [x] 01-01-PLAN.md — Scaffold + infraestrutura + schema Prisma + seed de categorias
- [ ] 01-02-PLAN.md — Login, middleware, shell de navegação e deploy na Vercel

**UI hint**: yes

### Phase 2: Core CRUD

**Goal**: Usuário pode registrar, editar, excluir e consultar todos os lançamentos financeiros de Casa e Empresa, incluindo transferências de pró-labore, e ver o resumo mensal no dashboard da Casa
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: LANC-01, LANC-02, LANC-03, LANC-04, LANC-05, LANC-06, DASH-01, DASH-02
**Success Criteria** (what must be TRUE):

  1. Usuário pode criar um lançamento com data, descrição, valor, tipo, categoria e conta (Casa ou Empresa) e vê-lo na lista filtrada por conta e mês
  2. Usuário pode editar qualquer campo de um lançamento existente e a alteração é refletida imediatamente
  3. Usuário pode excluir um lançamento e ele desaparece da lista
  4. Usuário pode registrar uma transferência de pró-labore: uma única operação cria saída na Empresa e entrada na Casa atomicamente
  5. Usuário vê o dashboard da Casa com teto do mês, total planejado, folga e gasto até hoje, além de barras por categoria e gráfico semanal

**Plans**: 4/4 plans complete
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Schema migration (pairId, MonthlyBudget, isDefault) + package installs

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Transaction CRUD slice (list, Sheet form, delete Dialog, filters)
- [x] 02-04-PLAN.md — Casa dashboard (4 cards, inline ceiling editor, spending bars, Recharts weekly chart)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Pró-labore atomic pair + category management (create inline, Gerenciar Sheet)

**UI hint**: yes

### Phase 3: Planning

**Goal**: Usuário pode planejar o mês por categorias e acompanhar os gastos semana a semana, com contas fixas que entram automaticamente e metas de poupança com progresso visível
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, FIXA-01, FIXA-02, META-01, META-02
**Success Criteria** (what must be TRUE):

  1. Usuário pode definir o teto do mês e criar itens no plano com nome, grupo, valor e repetições; o sistema calcula total e percentual do teto
  2. Usuário vê 4 cartões semanais (sem 1–7, 8–14, 15–21, 22–fim) com o planejado, campo "Gastei R$" e restante por semana
  3. Contas fixas cadastradas aparecem automaticamente no grupo "Contas fixas" do plano do mês sem redigitar
  4. Usuário pode copiar o plano do mês anterior com um único botão
  5. Usuário vê metas de poupança (incluindo as pré-cadastradas "Reserva de emergência" e "Caixinha do carro") com barra de progresso e quanto guardar por mês

**Plans**: 4 plans
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Fundação: 5 modelos Prisma + Vitest + extração de src/lib/weeks.ts (testes de faixa de semana) + shadcn Checkbox/Switch/Progress/Table

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Planejamento (core): tabela de itens + Resumo (teto/Planejado/Folga + barra segmentada) + pré-preenchimento do 1º mês + Copiar plano do mês anterior
- [x] 03-04-PLAN.md — Contas fixas, gastos do ano ÷12 e metas (3 cards, CRUD, seed de 2 metas, barra de progresso)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — Cartões semanais com "Gastei R$" automático + override, contas fixas derivadas no plano e integração do dashboard (Planejado/Folga)

**UI hint**: yes

### Phase 3.5: Casa — Acompanhamento (rework)

**Goal**: As a pessoa que lança as despesas da Casa no dia a dia, I want to ver o dinheiro do mês diminuir, o gasto por categoria contra um teto de referência e o gasto semanal somado sozinho, so that eu acompanhe a Casa sem manter um plano manual.
**Mode:** mvp
**Depends on**: Phase 3
**Design**: `docs/superpowers/specs/2026-11-25-casa-acompanhamento-design.md` (fonte autoritativa)
**Requirements**: CASA-R-01, CASA-R-02, CASA-R-03, CASA-R-04, CASA-R-05 (descritivos desta rodada de rework)
**Success Criteria** (what must be TRUE):

  1. Usuário vê a barra "Dinheiro do mês" (MonthlyBudget.ceilingCents, editável inline) e o restante = dinheiro do mês − despesas da Casa no mês
  2. Categorias variáveis da Casa com teto definido mostram "gastei X de Y" como referência (nunca bloqueia); sem teto mostram só o gasto
  3. Gasto semanal (1–7/8–14/15–21/22–fim) por categoria é calculado automaticamente dos lançamentos, sem digitação
  4. PlanItem e WeeklySpend e os componentes do planejamento semanal manual foram removidos
  5. Dashboard da Casa mostra "Dinheiro do mês" / "Restante do mês" / "Gasto até hoje" e mantém o gráfico de gastos reais por semana

**Plans**: 3 plans
Plans:
**Wave 0**

- [x] 03b-01-PLAN.md — Backup (checkpoint bloqueante) + migração destrutiva: remove PlanItem/WeeklySpend, cria CategoryBudget

**Wave 1** *(blocked on Wave 0 completion)*

- [x] 03b-02-PLAN.md — Núcleo do acompanhamento: funções puras testadas + service/loader/actions/schema + tela /planejamento (barra do mês, tetos por categoria, semanal automático) + remoção dos componentes do plano manual

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03b-03-PLAN.md — Dashboard da Casa (Dinheiro do mês / Restante do mês / Gasto até hoje) + verificação ponta a ponta

**UI hint**: yes

### Phase 4: Empresas (multi) e Renda Familiar

**Goal**: Usuário gerencia **N empresas independentes** (hoje Elite Juris, Achadinhos, Infoproduto), cada uma com P&L próprio (receitas − custos categorizados = lucro); o pró-labore de cada empresa alimenta a **renda familiar**; e o usuário vê o **consolidado das empresas** e uma **projeção** de quanto vai sobrar, além das dívidas e DAS **por empresa**.
**Mode:** mvp
**Depends on**: Phase 3
**Design**: `docs/superpowers/specs/2026-11-25-multi-empresa-renda-familiar-design.md` (fonte autoritativa; leitura obrigatória antes de discutir/planejar esta fase)
**Requirements**: CHAN-01, CHAN-02, CHAN-03, CHAN-04, CHAN-05, DIV-01, DIV-02, DIV-03, DIV-04, DIV-05, DIV-06, DASH-03, DASH-04 (reinterpretados no contexto multi-empresa; EMPF-01, EMPF-02, EMPF-03, EMPF-04, EMPF-05, EMPF-06 (Fatia 1 - fundação, formalizados); CHAN-*/DIV-*/DASH-03/04 nas fatias seguintes)
**Nota de reorganização (25/11/2026)**: substitui a antiga "Fase 4: Empresa" (uma empresa). Provável divisão em sub-fases no planejamento: (4a) fundação multi-empresa — modelo de dados Casa + N empresas, CRUD de empresas, seletor; (4b) P&L por empresa; (4c) pró-labore multi-origem → renda familiar; (4d) consolidado + projeção. Multiusuário/orçamento por pessoa ficam adiados para a cauda do roadmap.
**Success Criteria** (what must be TRUE):

  1. Usuário pode criar/editar empresas e, em cada uma, registrar receitas e custos categorizados; o sistema exibe faturamento bruto/líquido e lucro. Para empresas de afiliado, registra comissões e anúncios (Meta) com lucro e ROAS.
  2. Pronampe e Parcelamento do Simples aparecem pré-cadastrados **na empresa dona**; usuário registra pagamentos e vê barra de progresso por dívida (dívidas e DAS são por empresa).
  3. Usuário "aplica" o pró-labore de cada empresa e ele cai automaticamente na **renda familiar**; a visão da família mostra renda − gastos = quanto sobra, caixa e cada caixinha de investimento (metas da Fase 3).
  4. Usuário vê o **consolidado das empresas** (quanto geram juntas) e uma **projeção** de caixa para 3–6 meses, com alerta de saldo negativo por empresa e no consolidado.
  5. Usuário vê o "caminho do dinheiro" por empresa (faturamento → impostos → dívidas → caixa → pró-labore → renda familiar).

**Plans**: 4 plans (Fatia 1 — Fundação multi-empresa; demais fatias 4b–4d serão planejadas em rodadas próprias)
Plans:
**Wave 1**

- [x] 04-01-PLAN.md — Wave 0: checkpoint de backup + versão PG>=15, instalar DropdownMenu, testes RED das funções puras

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — Migração ContaType→Empresa/empresaId (dados da Casa preservados, NULLS NOT DISTINCT) + store generalizado + refactor dos consumidores de account

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03-PLAN.md — CRUD de empresa (/empresas): service/actions/loader + Sheet/ColorPicker/Dialog + categorias por empresa + seed das 3 empresas

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 04-04-PLAN.md — ContaSelector (dropdown Casa + empresas) global + lançamentos/visão geral por contexto + verificação ponta a ponta

#### Fatia 2 — P&L por empresa (`/canais`)

**Plans:** 1 plan (VISÃO derivada sobre lançamentos; sem migração, sem modelo novo)
Plans:
**Wave 1**

- [ ] 04b-01-PLAN.md — P&L da empresa ativa em `/canais`: funções puras testadas (bruto/líquido/lucro + agrupamento por categoria) + service/loader empresaId-aware + tela (cards + listas de receitas/custos por categoria) + placeholder da Casa + verificação ponta a ponta

**UI hint**: yes

#### Fatia 3 — Pró-labore multi-origem → Renda Familiar

**Plans:** 3 plans (reabilita o par de pró-labore no mundo multi-empresa + bloco Renda familiar por origem; migração aditiva de 1 campo)
Plans:
**Wave 0**

- [x] 04c-01-PLAN.md — Checkpoint de backup + migração aditiva `Transaction.origemEmpresaId` (rastreia a empresa de origem do pró-labore)

**Wave 1** *(blocked on Wave 0 completion)*

- [x] 04c-02-PLAN.md — Fluxo "Aplicar pró-labore" reabilitado (par atômico multi-empresa): service/schema/actions empresaId-aware + getOrCreate categoria "Pró-labore" + TransactionSheet com origem = contexto ativo + testes Vitest + verificação ponta a ponta

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04c-03-PLAN.md — Bloco "Renda familiar por origem" na Visão Geral da Casa: função pura testada (agrupamento por origem) + service/loader + componente + render no contexto Casa + verificação ponta a ponta

#### Fatia 4 — Consolidado + Projeção

**Plans:** 4 plans (DAS estimado por empresa + tela Consolidado + projeção simples com alerta de mês negativo; migração aditiva de 1 campo `Empresa.aliquotaDasPercent`)
Plans:
**Wave 0**

- [x] 04d-01-PLAN.md — Checkpoint de backup + migração aditiva `Empresa.aliquotaDasPercent` (alíquota do DAS por empresa, nullable) [CONS-02]

**Wave 1** *(blocked on Wave 0 completion)*

- [x] 04d-02-PLAN.md — DAS estimado por empresa (fatia vertical): função pura `computeDasEstimado` + Vitest + alíquota editável no CRUD de empresa + card "DAS estimado" no P&L (/canais) [CONS-02]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04d-03-PLAN.md — Tela "Consolidado" (fatia vertical): funções puras de agregação + Vitest + loader reusando P&L/DAS por empresa + tabela por empresa + totais + item de menu context 'empresa' [CONS-01]

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04d-04-PLAN.md — Projeção simples + alerta de saldo negativo (fatia vertical): funções puras de média/projeção/mês negativo + Vitest + loader da série histórica + tabela de projeção por mês com destaque de negativo e rótulo de estimativa [CONS-03, CONS-04]

### Phase 5: Calendário e Alertas

**Goal**: Usuário vê todos os vencimentos de Casa e Empresa em um calendário mensal e recebe notificações push do navegador 3 dias antes e no dia de cada vencimento
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04
**Success Criteria** (what must be TRUE):

  1. Usuário vê calendário mensal com vencimentos da Casa (azul) e Empresa (laranja) em cores distintas
  2. Usuário vê lista lateral com todos os compromissos do mês e seus valores
  3. Navegador exibe notificação push 3 dias antes de um vencimento (ex.: DAS dia 20 → alerta dia 17)
  4. Navegador exibe notificação push às 9h no dia do vencimento

**Plans**: TBD
**UI hint**: yes

### Phase 6: Relatório Mensal

**Goal**: Usuário pode gerar e baixar um relatório mensal completo em PDF com comparação Casa vs planejado, histórico de 6 meses e destaques automáticos
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: REL-01, REL-02, REL-03, REL-04, REL-05
**Success Criteria** (what must be TRUE):

  1. Usuário seleciona um mês e vê relatório com cartões: gasto da Casa vs planejado, comparação com mês anterior, faturamento da Empresa e lucro após dívidas
  2. Usuário vê tabela da Casa com planejado, gasto, diferença e comparação por categoria com o mês anterior
  3. Usuário vê gráfico dos últimos 6 meses de gasto da Casa e faturamento da Empresa
  4. Sistema destaca automaticamente o que ficou dentro do plano, o que passou e o maior gasto do mês
  5. Usuário clica em "Baixar PDF" e recebe o arquivo sem erros de timeout

**Plans**: TBD
**UI hint**: yes

### Phase 7: Importação CSV/OFX

**Goal**: Usuário pode importar extratos bancários CSV ou OFX com categorização automática por regras, revisão antes de salvar e proteção contra duplicados
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: IMP-01, IMP-02, IMP-03, IMP-04, IMP-05, IMP-06
**Success Criteria** (what must be TRUE):

  1. Usuário faz upload de arquivo .CSV ou .OFX e escolhe se é da Casa ou da Empresa; a tabela de prévia aparece com data, descrição, valor, categoria sugerida e conta
  2. Linhas sem categoria ficam marcadas como "revisar" e o usuário pode corrigir a categoria antes de salvar
  3. Usuário seleciona quais lançamentos importar e os demais são descartados
  4. Ao corrigir uma categoria durante a importação, o sistema oferece criar uma regra automática para descrições futuras semelhantes
  5. O sistema não importa lançamentos duplicados (mesmo valor, data e descrição já existente no banco)

**Plans**: TBD

### Phase 8: PWA Polish

**Goal**: Usuário pode instalar o app no celular via PWA, usar a tela de Lançamento Rápido otimizada para toque e acessar o sistema offline
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: AUTH-03, LANC-07
**Success Criteria** (what must be TRUE):

  1. Usuário no iOS/Android vê prompt de instalação e o app aparece na tela inicial como app standalone
  2. Usuário pode abrir a tela de Lançamento Rápido no celular, digitar valor com teclado numérico nativo e ver o saldo restante na categoria antes de salvar
  3. Todos os botões interativos têm no mínimo 44 px de altura em qualquer tela
  4. O app carrega a última tela visitada mesmo sem conexão (service worker Serwist ativo)

**Plans**: TBD
**UI hint**: yes

### Phase 9: Assistente de WhatsApp (IA)

**Goal**: O usuário lança gastos/receitas e consulta relatórios pelo WhatsApp (número dedicado do bot). Uma frase em PT-BR vira lançamento no destino certo (Casa ou empresa), respeitando a regra de ouro Casa × Empresa (na dúvida, pergunta); o bot confirma e responde consultas do mês.
**Mode:** mvp
**Depends on**: Phase 4 (lançamentos, pró-labore, P&L já existem e são reusados)
**Design**: `docs/superpowers/specs/2026-11-26-whatsapp-assistant-design.md` (fonte autoritativa; leitura obrigatória antes de planejar)
**Transporte**: Evolution API (self-hosted na VPS do usuário) — webhook recebe, REST envia; app serverless na Vercel. IA: Claude Haiku.
**Success Criteria** (what must be TRUE):

  1. O usuário manda "gastei 50 de gasolina na Casa" e o bot cria o lançamento no destino certo e confirma com um resumo ("✓ R$ 50 · Combustível · Casa")
  2. Quando o destino (Casa × empresa) não fica claro, o bot pergunta antes de lançar — nunca adivinha
  3. Só o número autorizado do usuário consegue lançar/consultar; webhooks repetidos não duplicam lançamento
  4. O usuário consulta pelo chat (gasto por categoria, restante da Casa, P&L de uma empresa, resumo do mês) e recebe a resposta formatada em PT-BR (R$ 1.234,56, dd/mm/aaaa)
  5. O pró-labore pelo WhatsApp cria o par atômico (saída da empresa + entrada na Casa) com confirmação reforçada

**Fatias** (planejadas uma por vez):
- **Fatia 1** — Texto → lançar simples (webhook + segurança + allowlist + idempotência + IA + regra de destino + multi-turno + criar lançamento + confirmação). *Pró-labore fora.*
- **Fatia 2** — Pró-labore por chat (par atômico, confirmação reforçada)
- **Fatia 3** — Relatórios por chat
- **Fatia 4** — Foto de cupom (OCR via Claude visão) — spike antes
- **Fatia 5** — Áudio (transcrição) — spike antes

**Plans**: Fatia 1 — 3 plans (em waves 1→2→3)
- [x] 09-01-PLAN.md — Fundação: migração aditiva (3 tabelas) + SDK Anthropic + exclusão de /api/whatsapp no middleware + funções puras parse/resolve/schema (Wave 0 RED) — completo 2026-11-27
- [ ] 09-02-PLAN.md — Caminho feliz ponta-a-ponta: webhook (segredo+allowlist+dedupe) → Claude Haiku → resolve → createTransactionService (reuso) → confirmação (C-1, C-3)
- [ ] 09-03-PLAN.md — Multi-turno (pergunta quando incerto + completa na próxima msg, C-2) + setup externo (env/instância Evolution/allowlist) + verificação ponta-a-ponta real
**UI hint**: no (canal é o WhatsApp; sem telas novas — só setup/env)

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/2 | In Progress|  |
| 2. Core CRUD | 4/4 | Complete   | 2026-11-24 |
| 3. Planning | 4/4 | Complete   | 2026-11-25 |
| 3.5. Casa — Acompanhamento (rework) | 0/3 | Planned | - |
| 4. Empresa | 0/? | Not started | - |
| 5. Calendário e Alertas | 0/? | Not started | - |
| 6. Relatório Mensal | 0/? | Not started | - |
| 7. Importação CSV/OFX | 0/? | Not started | - |
| 8. PWA Polish | 0/? | Not started | - |
| 9. Assistente de WhatsApp (IA) | 1/3 (Fatia 1) | **Em progresso — Onda 1 (09-01) completa** | - |

---

## Coverage

**v1 requirements:** 48 total
**Mapped:** 48/48
**Orphans:** 0

| Requirement | Phase |
|-------------|-------|
| AUTH-01 | Phase 1 |
| AUTH-02 | Phase 1 |
| AUTH-03 | Phase 8 |
| LANC-01 | Phase 2 |
| LANC-02 | Phase 2 |
| LANC-03 | Phase 2 |
| LANC-04 | Phase 2 |
| LANC-05 | Phase 2 |
| LANC-06 | Phase 2 |
| LANC-07 | Phase 8 |
| PLAN-01 | Phase 3 |
| PLAN-02 | Phase 3 |
| PLAN-03 | Phase 3 |
| PLAN-04 | Phase 3 |
| PLAN-05 | Phase 3 |
| PLAN-06 | Phase 3 |
| FIXA-01 | Phase 3 |
| FIXA-02 | Phase 3 |
| META-01 | Phase 3 |
| META-02 | Phase 3 |
| DASH-01 | Phase 2 |
| DASH-02 | Phase 2 |
| CHAN-01 | Phase 4 |
| CHAN-02 | Phase 4 |
| CHAN-03 | Phase 4 |
| CHAN-04 | Phase 4 |
| CHAN-05 | Phase 4 |
| DIV-01 | Phase 4 |
| DIV-02 | Phase 4 |
| DIV-03 | Phase 4 |
| DIV-04 | Phase 4 |
| DIV-05 | Phase 4 |
| DIV-06 | Phase 4 |
| DASH-03 | Phase 4 |
| DASH-04 | Phase 4 |
| CAL-01 | Phase 5 |
| CAL-02 | Phase 5 |
| CAL-03 | Phase 5 |
| CAL-04 | Phase 5 |
| REL-01 | Phase 6 |
| REL-02 | Phase 6 |
| REL-03 | Phase 6 |
| REL-04 | Phase 6 |
| REL-05 | Phase 6 |
| IMP-01 | Phase 7 |
| IMP-02 | Phase 7 |
| IMP-03 | Phase 7 |
| IMP-04 | Phase 7 |
| IMP-05 | Phase 7 |
| IMP-06 | Phase 7 |

---

*Created: 28/10/2026*
*Last updated: 28/10/2026 — initial roadmap*
