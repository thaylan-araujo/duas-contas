# Requirements: Duas Contas

**Defined:** 28/10/2026
**Core Value:** A Casa e a Empresa nunca se misturam — dinheiro só passa de uma para outra como pró-labore, registrado como transferência explícita.

## v1 Requirements

### Autenticação

- [ ] **AUTH-01**: Usuário pode fazer login com senha simples (uso pessoal)
- [ ] **AUTH-02**: Sessão persiste entre recargas do navegador
- [ ] **AUTH-03**: Usuário pode acessar o sistema no celular via PWA instalável

### Contas e Lançamentos

- [ ] **LANC-01**: Usuário pode criar lançamento com data, descrição, valor, tipo (entrada/saída), categoria e conta (Casa ou Empresa)
- [ ] **LANC-02**: Usuário pode editar qualquer campo de um lançamento existente
- [ ] **LANC-03**: Usuário pode excluir um lançamento
- [ ] **LANC-04**: Usuário pode listar lançamentos filtrados por conta e mês
- [ ] **LANC-05**: Usuário pode registrar transferência de pró-labore da Empresa para a Casa (cria saída na Empresa e entrada na Casa em uma única operação)
- [ ] **LANC-06**: Usuário pode criar, editar e excluir categorias além das categorias padrão
- [ ] **LANC-07**: Usuário pode registrar lançamento na tela de Lançamento Rápido (otimizada para celular: botões grandes, teclado numérico no campo de valor, mostra saldo restante na categoria após escolher)

### Planejamento e Semanas (Casa)

- [ ] **PLAN-01**: Usuário pode definir o teto de gastos do mês (padrão R$ 3.000)
- [ ] **PLAN-02**: Usuário pode criar itens no plano do mês com nome, grupo, valor por vez e número de repetições; sistema calcula total e % do teto
- [ ] **PLAN-03**: Usuário vê resumo do plano com total planejado, folga (ou quanto passou do teto) e barra dividida por grupo
- [ ] **PLAN-04**: Usuário vê 4 cartões semanais (sem 1–7, 8–14, 15–21, 22–fim) com itens planejados para cada semana, campo "Gastei R$" e restante por item e por semana
- [ ] **PLAN-05**: Usuário pode copiar o plano do mês anterior com um botão
- [ ] **PLAN-06**: Contas fixas cadastradas entram automaticamente no plano do mês no grupo Contas fixas, sem redigitar

### Contas Fixas, Gastos Anuais e Metas (Casa)

- [ ] **FIXA-01**: Usuário pode cadastrar conta fixa com nome, dia de vencimento, valor e flag de débito automático
- [ ] **FIXA-02**: Usuário pode cadastrar gasto anual (IPVA, licenciamento, manutenção, presentes) com valor total e mês de vencimento; sistema calcula quanto guardar por mês
- [ ] **META-01**: Usuário pode criar meta de poupança com nome, valor da meta, valor guardado e prazo; sistema mostra barra de progresso e quanto guardar por mês
- [ ] **META-02**: Sistema começa com metas "Reserva de emergência" e "Caixinha do carro" pré-cadastradas

### Dashboard (Casa)

- [ ] **DASH-01**: Usuário vê painel da Casa com cartões: teto do mês, total planejado, folga e gasto até hoje
- [ ] **DASH-02**: Usuário vê barras de distribuição por categoria e gráfico de gastos semana a semana

### Canais e Fluxo de Caixa (Empresa)

- [ ] **CHAN-01**: Usuário pode registrar comissões do mês por canal (Dicas da Liz / Shopee, Achadinhos da Mel / Shein)
- [ ] **CHAN-02**: Usuário pode registrar gasto com anúncios Meta por canal no mês
- [ ] **CHAN-03**: Sistema calcula lucro do canal (comissões − anúncios) e ROAS (comissões ÷ anúncios) por canal
- [ ] **CHAN-04**: Usuário vê projeção de fluxo de caixa da empresa para os próximos 3 ou 6 meses (saldo inicial → comissões previstas → DAS → Simples parcelamento → Pronampe → anúncios → pró-labore → saldo final)
- [ ] **CHAN-05**: Sistema alerta quando o saldo final projetado de algum mês for negativo, indicando o mês e quanto falta

### Dívidas (Empresa)

- [ ] **DIV-01**: Usuário pode cadastrar dívida com nome, credor, saldo devedor, valor da parcela, total de parcelas, dia de vencimento e status
- [ ] **DIV-02**: Usuário vê cartão por dívida com parcelas pagas/total, barra de progresso, saldo devedor atual e dia de vencimento
- [ ] **DIV-03**: Usuário vê resumo de dívidas: total devido, parcelas por mês e mês previsto para quitar tudo
- [ ] **DIV-04**: Usuário pode registrar pagamento de parcela; sistema cria automaticamente o lançamento de saída na conta Empresa
- [ ] **DIV-05**: Sistema mostra status por dívida: Em dia, Acompanhar ou Atrasada (com dias de atraso)
- [ ] **DIV-06**: Sistema vem com Pronampe (Itaú) e Parcelamento do Simples pré-cadastrados como dívidas ativas

### Dashboard (Empresa)

- [ ] **DASH-03**: Usuário vê painel da Empresa com cartões: faturamento, DAS do mês, parcelas de dívidas e sobra para pró-labore
- [ ] **DASH-04**: Usuário vê "caminho do dinheiro" (faturamento → impostos → dívidas → caixa → pró-labore) e tabela de compromissos

### Calendário de Vencimentos

- [ ] **CAL-01**: Usuário vê calendário mensal com vencimentos e gastos programados da Casa e Empresa (cores diferentes por conta)
- [ ] **CAL-02**: Usuário vê lista lateral com compromissos do mês e seus valores
- [ ] **CAL-03**: Sistema avisa 3 dias antes dos vencimentos via notificação no navegador
- [ ] **CAL-04**: Sistema avisa no dia do vencimento às 9h via notificação no navegador

### Relatório Mensal

- [ ] **REL-01**: Usuário pode selecionar o mês e visualizar relatório com cartões (gasto da casa vs planejado, comparação com mês anterior, faturamento da empresa, lucro após dívidas)
- [ ] **REL-02**: Usuário vê tabela da casa: planejado, gasto, diferença e comparação com mês anterior por categoria
- [ ] **REL-03**: Usuário vê gráfico dos últimos 6 meses (gasto da casa e faturamento da empresa)
- [ ] **REL-04**: Sistema destaca o que ficou dentro do plano, o que passou e o maior gasto do mês
- [ ] **REL-05**: Usuário pode baixar o relatório em PDF

### Importação de Extrato

- [ ] **IMP-01**: Usuário pode enviar arquivo .CSV ou .OFX e escolher se é da Casa ou da Empresa
- [ ] **IMP-02**: Sistema exibe tabela com data, descrição, valor, categoria sugerida (editável) e conta; linhas sem categoria ficam marcadas como "revisar"
- [ ] **IMP-03**: Usuário pode selecionar quais lançamentos salvar da importação
- [ ] **IMP-04**: Sistema aplica regras automáticas de categorização ("se descrição contém X → categoria Y, conta Z")
- [ ] **IMP-05**: Quando usuário corrige uma categoria durante a importação, sistema oferece criar uma regra automática
- [ ] **IMP-06**: Sistema não importa duplicados (mesmo valor, data e descrição de lançamento já existente)

## v2 Requirements

### UX e Acessibilidade

- **UX-01**: Modo escuro
- **UX-02**: Atalhos de teclado para lançamento rápido no desktop

### Empresa

- **EMP-01**: Suporte a múltiplos usuários (multi-tenant) para compartilhar acesso com sócio ou contador
- **EMP-02**: Canal "Infoproduto" ativo com métricas próprias
- **EMP-03**: Notificação de DAS via WhatsApp

### Integração

- **INT-01**: Open Finance (depois de MPV validado — requer certificação Bacen)

## Out of Scope

| Feature | Motivo |
|---------|--------|
| App nativo iOS/Android | PWA é suficiente para uso pessoal; loja é overhead desnecessário |
| Login OAuth (Google/GitHub) | Uso pessoal; senha simples é suficiente |
| Emissão de NF-e | Fora do escopo de controle financeiro pessoal |
| Multi-empresa | Começa com uma empresa só; arquitetura permite evolução futura |
| Open Finance (Bacen) | 12–16 semanas de engenharia + certificação; CSV/OFX cobre a necessidade |
| Chat/comentários em lançamentos | Não é core; observação no lançamento basta |

## Traceability

| Requisito | Fase | Status |
|-----------|------|--------|
| AUTH-01 | Fase 1 | Pendente |
| AUTH-02 | Fase 1 | Pendente |
| AUTH-03 | Fase 8 | Pendente |
| LANC-01 | Fase 2 | Pendente |
| LANC-02 | Fase 2 | Pendente |
| LANC-03 | Fase 2 | Pendente |
| LANC-04 | Fase 2 | Pendente |
| LANC-05 | Fase 2 | Pendente |
| LANC-06 | Fase 2 | Pendente |
| LANC-07 | Fase 8 | Pendente |
| PLAN-01 | Fase 3 | Pendente |
| PLAN-02 | Fase 3 | Pendente |
| PLAN-03 | Fase 3 | Pendente |
| PLAN-04 | Fase 3 | Pendente |
| PLAN-05 | Fase 3 | Pendente |
| PLAN-06 | Fase 3 | Pendente |
| FIXA-01 | Fase 3 | Pendente |
| FIXA-02 | Fase 3 | Pendente |
| META-01 | Fase 3 | Pendente |
| META-02 | Fase 3 | Pendente |
| DASH-01 | Fase 2 | Pendente |
| DASH-02 | Fase 2 | Pendente |
| CHAN-01 | Fase 4 | Pendente |
| CHAN-02 | Fase 4 | Pendente |
| CHAN-03 | Fase 4 | Pendente |
| CHAN-04 | Fase 4 | Pendente |
| CHAN-05 | Fase 4 | Pendente |
| DIV-01 | Fase 4 | Pendente |
| DIV-02 | Fase 4 | Pendente |
| DIV-03 | Fase 4 | Pendente |
| DIV-04 | Fase 4 | Pendente |
| DIV-05 | Fase 4 | Pendente |
| DIV-06 | Fase 4 | Pendente |
| DASH-03 | Fase 4 | Pendente |
| DASH-04 | Fase 4 | Pendente |
| CAL-01 | Fase 5 | Pendente |
| CAL-02 | Fase 5 | Pendente |
| CAL-03 | Fase 5 | Pendente |
| CAL-04 | Fase 5 | Pendente |
| REL-01 | Fase 6 | Pendente |
| REL-02 | Fase 6 | Pendente |
| REL-03 | Fase 6 | Pendente |
| REL-04 | Fase 6 | Pendente |
| REL-05 | Fase 6 | Pendente |
| IMP-01 | Fase 7 | Pendente |
| IMP-02 | Fase 7 | Pendente |
| IMP-03 | Fase 7 | Pendente |
| IMP-04 | Fase 7 | Pendente |
| IMP-05 | Fase 7 | Pendente |
| IMP-06 | Fase 7 | Pendente |

**Coverage:**
- v1 requirements: 48 total
- Mapeados para fases: 48
- Não mapeados: 0 ✓

---
*Requirements defined: 28/10/2026*
*Last updated: 28/10/2026 after initial definition*
