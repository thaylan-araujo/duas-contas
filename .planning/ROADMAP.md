# Roadmap: Duas Contas

**Project:** Duas Contas
**Core Value:** A Casa e a Empresa nunca se misturam — dinheiro só passa de uma para outra como pró-labore, registrado como transferência explícita.
**Created:** 28/10/2026
**Mode:** mvp

---

## Phases

- [ ] **Phase 1: Foundation** - Infraestrutura, autenticação e utilitários críticos antes de qualquer feature
- [ ] **Phase 2: Core CRUD** - Lançamentos, pró-labore e dashboard da Casa
- [ ] **Phase 3: Planning** - Orçamento mensal, cartões semanais, contas fixas e metas
- [ ] **Phase 4: Empresa** - Canais P&L, dívidas, fluxo de caixa e dashboard da Empresa
- [ ] **Phase 5: Calendário e Alertas** - Calendário de vencimentos com notificações push
- [ ] **Phase 6: Relatório Mensal** - Relatório completo e exportação em PDF
- [ ] **Phase 7: Importação CSV/OFX** - Upload de extrato com categorização automática
- [ ] **Phase 8: PWA Polish** - Mobile refinado, lançamento rápido e instalação PWA

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
**Plans**: 2 plans
Plans:
- [ ] 01-01-PLAN.md — Scaffold + infraestrutura + schema Prisma + seed de categorias
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
**Plans**: TBD
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
**Plans**: TBD
**UI hint**: yes

### Phase 4: Empresa
**Goal**: Usuário pode acompanhar o P&L dos canais de afiliados, monitorar o progresso das dívidas ativas (Pronampe e Simples parcelado) e projetar o fluxo de caixa da empresa nos próximos meses
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: CHAN-01, CHAN-02, CHAN-03, CHAN-04, CHAN-05, DIV-01, DIV-02, DIV-03, DIV-04, DIV-05, DIV-06, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. Usuário pode registrar comissões e gastos com anúncios Meta por canal; o sistema exibe lucro (comissões − anúncios) e ROAS por canal
  2. Pronampe e Parcelamento do Simples aparecem pré-cadastrados; usuário pode registrar pagamentos de parcela e vê barra de progresso por dívida
  3. Usuário vê projeção de fluxo de caixa para 3 ou 6 meses com saldo final por mês; meses com saldo negativo projetado são destacados com alerta e o quanto falta
  4. Usuário vê o dashboard da Empresa com faturamento, DAS do mês, parcelas de dívidas e sobra para pró-labore
  5. Usuário vê o "caminho do dinheiro" (faturamento → impostos → dívidas → caixa → pró-labore) e tabela de compromissos
**Plans**: TBD
**UI hint**: yes

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

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Not started | - |
| 2. Core CRUD | 0/? | Not started | - |
| 3. Planning | 0/? | Not started | - |
| 4. Empresa | 0/? | Not started | - |
| 5. Calendário e Alertas | 0/? | Not started | - |
| 6. Relatório Mensal | 0/? | Not started | - |
| 7. Importação CSV/OFX | 0/? | Not started | - |
| 8. PWA Polish | 0/? | Not started | - |

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
