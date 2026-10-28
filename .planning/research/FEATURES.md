# Feature Research

**Domain:** Personal finance + small business finance web app (Brasil, Simples Nacional)
**Researched:** 28/10/2026
**Confidence:** MEDIUM (cross-checked web sources, no authoritative library docs)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that any finance app must have. Missing one = product feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Transaction entry (manual) | Core action; without it there is nothing to track | LOW | spec.md: Tela 1 lançamento rápido + lançamentos por conta |
| List/edit/delete transactions | Basic CRUD; any data entry tool needs correction | LOW | spec.md: Etapa 1, Tela base |
| Filter by account and month | Users need to see only relevant data | LOW | spec.md: filter por conta e mês |
| Category assignment | Organizes spending into meaningful groups | LOW | spec.md: Categoria entity + grupos Comida, Combustível, etc. |
| Monthly balance summary | "How much did I spend this month?" is the #1 question | LOW | spec.md: Visão geral Casa |
| Payment reminders / due-date alerts | Missing a bill due date is a tangible harm | MEDIUM | spec.md: Calendário, alerta 3 dias antes + no dia |
| Mobile-friendly interface | Expenses happen on the go | MEDIUM | spec.md: PWA, botões 44 px, responsivo |
| Visual spending breakdown | Charts/bars for where money goes; users expect pictures not just numbers | MEDIUM | spec.md: barras por categoria, gráfico semana a semana |
| Multiple accounts (Casa + Empresa) | Small business owners have at minimum two pots of money | MEDIUM | spec.md: core architecture |
| CSV/OFX import | Bank statements exist; users expect to pull data in | HIGH | spec.md: Tela 9, Etapa 7 |

### Differentiators (Competitive Advantage)

Features that make Duas Contas specifically better for this user's situation. No Brazilian app offers this combination.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Hard Casa↔Empresa wall with pró-labore bridge | No Brazilian consumer app models this separation. Prevents the #1 small-business financial mistake: mixing personal and business money | MEDIUM | Única regra de negócio inviolável do sistema. Transferência explícita cria rastreabilidade |
| Weekly budget sub-planning (4 semanas) | Mobills and Organizze plan monthly only. Weekly cartões let the user track R$ 250 mercado × 3 and combustível × 4 at the moment they happen | MEDIUM | spec.md: Tela 3, 4 cartões semanais. Não existe em nenhum concorrente BR pesquisado |
| DAS tracking with day-20 alert baked in | MEI/Simples apps (Qipu, Gestão MEI) handle DAS generation but not combined with household budget. Duas Contas surfaces the DAS directly on the Empresa dashboard without needing a separate tax app | LOW | DAS é entrada hardcoded no calendário e no fluxo de caixa |
| Per-channel affiliate P&L (lucro por canal) | Shopee afiliados earn 3–15% commission; Shein 2–20%. Sellers often discover months later that Meta ad spend ate the margin. Duas Contas shows comissões − anúncios = lucro and retorno (ROAS) per channel, in real time | MEDIUM | spec.md: Tela 5 Canais. Exclusivo para este perfil de usuário |
| 3–6 month cash flow projection with negative alert | Standard in B2B accounting tools (Wave, QuickBooks) but missing in Brazilian consumer apps. For a business with Pronampe + Simples parcelamento, knowing 4 months out that cash goes negative is critical | HIGH | spec.md: Tela 5 fluxo projetado. Complexidade: requer projeção de comissões variáveis |
| Debt progress bars (Pronampe + Simples) | Debt payoff apps (Debt Manager, AlmostZero) show progress bars and payoff timelines. No Brazilian personal finance app surfaces business debts visually. Seeing 1 of 48 parcelas paid is demotivating; seeing the bar move motivates payment | LOW | spec.md: Tela 6 Dívidas. Registrar pagamento → cria lançamento automaticamente |
| Annual expenses ÷ 12 provisioning (IPVA, licenciamento) | IPVA Goiás and car licensing hit once a year but must be budgeted monthly. No consumer app in Brazil has this built in; users do it in spreadsheets | LOW | spec.md: Tela 4 Gastos anuais ÷ 12. Calcular R$/mês to reserve |
| Savings goals with monthly contribution calculator | Goal apps exist internationally; in Brazil they are rare at consumer level. (meta − guardado) ÷ meses até prazo = quanto guardar por mês is actionable | LOW | spec.md: Tela 4 Metas. Starts with Reserva de emergência and Caixinha do carro |
| Copy previous month's plan | Reduces friction for recurring budgets. The user's routine (R$ 1.000 compra mês, R$ 250 × 3 mercado, R$ 100 × 4 combustível) is stable month-to-month | LOW | spec.md: Tela 3 "Copiar plano do mês anterior" |
| Pró-labore as single atomic transfer | One operation that creates both an Empresa saída and a Casa entrada, explicitly labeled, never mixing with revenue or expenses on either side | LOW | spec.md: Transferência entity. Enforces the core business rule |

### Anti-Features (Do NOT Build for MVP)

Tempting but harmful features that create complexity without proportionate value at this scale.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Open Finance / bank auto-import | Automatic categorization sounds great | Requires Bacen Open Finance certification (expensive, months of compliance work); error handling is 12–16 weeks of engineering per the research. No value in an MVP that already has manual entry and CSV import | Deliver CSV/OFX import well. If user wants automation later, it is a distinct milestone |
| NF-e / nota fiscal emission | MEI apps (MaisMei, Qipu) do this; users may ask | Tax document issuance requires Sefaz integration, digital certificate, state-specific rules. Completely out of scope for a personal finance tool | Link to MaisMei or PGMEI portal for NF emission |
| Multi-empresa support | "What if I have two companies?" | Architecture becomes multi-tenant; doubles schema complexity; no user need stated | Start single-company; spec says começa com uma empresa. Add later if needed |
| WhatsApp notifications (automated) | Mobills PRO offers a WhatsApp AI assistant; users will ask | Requires WhatsApp Business API token, Meta approval, webhook server; ongoing cost and compliance | Browser push notifications cover the 3-day DAS alert. WhatsApp is spec'd as "futuramente" |
| iOS/Android native app | "Faster, better UX" | Requires App Store / Play Store publishing, separate codebase or RN complexity, review cycles | PWA covers the mobile use case with zero distribution overhead |
| AI expense categorization | Organizze and Mobills offer AI categorization | At single-user scale with predictable recurring expenses, rule-based categorization (Regras de importação entity) is faster and more accurate than LLM inference. No model runs locally; API calls add latency and cost | Rule-based auto-categorization on import (spec Tela 9). User teaches rules once |
| Real-time multi-user / sharing | Couples managing money together is a common use case | The spec explicitly says personal use; no multi-user requirement stated | Single-user with simple password is sufficient |
| Investment portfolio tracking | Feature of premium tiers in Mobills etc. | Separate product category (corretoras, FIIs, stocks). No user need stated | Out of scope entirely |
| Subscription cancellation detection | Trend feature in US apps (Rocket Money) | Requires bank integration. The user's subscriptions are known and can be entered as contas fixas | Enter streaming as conta fixa with known monthly amount |
| Snowball / avalanche debt strategies | Debt payoff apps offer these | The user has only 2 debts (Pronampe, Simples parcelamento) with fixed installments. Strategy calculators add UI complexity for no gain here | Show saldo devedor, parcelas pagas / total, and data prevista de quitação — that is sufficient |
| Modo escuro | Users expect it from modern apps | Not in spec for MVP. Extra CSS tokens and testing surface area | Explicitly deferred to post-MVP per spec.md |

---

## Feature Dependencies

```
[Lançamento manual]
    └──requires──> [Conta entity] + [Categoria entity]

[Plano do mês]
    └──requires──> [Lançamento manual] (actual vs planned comparison)
    └──requires──> [Contas fixas] (auto-populate plan)

[Gastos semanais]
    └──requires──> [Plano do mês]
    └──requires──> [Lançamento manual] (to compute "Gastei" per week)

[Transferência pró-labore]
    └──requires──> [Conta Casa] + [Conta Empresa] both existing

[Canais e fluxo de caixa]
    └──requires──> [Canal entity] + [Comissão entity] + [Anúncio entity]
    └──requires──> [Dívida entity] (debts appear as fixed outflows in projection)

[Dívida → Registrar pagamento]
    └──requires──> [Lançamento manual] (creates Empresa saída automatically)

[Calendário de vencimentos]
    └──requires──> [Conta fixa] + [Gasto anual] + [Dívida] + [DAS fixed rule]

[Relatório mensal PDF]
    └──requires──> [Lançamento manual] + [Plano do mês] + [Canal/Comissão]

[Importar extrato CSV/OFX]
    └──requires──> [Lançamento manual] (import creates Lançamentos)
    └──requires──> [Regra de importação] entity

[PWA lançamento rápido]
    └──requires──> [Lançamento manual] (same underlying form, mobile-optimized)

[Gastos anuais ÷ 12]
    └──enhances──> [Plano do mês] (monthly provision shows in plan)

[Metas]
    ──independent──> (standalone savings goal tracking)
```

### Dependency Notes

- **Plano do mês requires Lançamento:** The "Gastei R$" field in weekly cards should pull from actual entries, not just manual input. This means basic transaction entry (Etapa 1) must exist before Planejamento (Etapa 2) is useful.
- **Canais requires Dívida:** The projected cash flow (Tela 5) includes Pronampe and Simples parcelas as fixed outflows, so Dívida entity must exist before the projection can be accurate.
- **Calendário requires most entities:** It is inherently an aggregation screen. Build it after Etapa 4 (Empresa) so all event sources exist.
- **Relatório requires all data:** Last to build; depends on all prior data being present.

---

## MVP Definition

### Launch With (Etapas 1–4, v1)

Minimum to validate the tool is useful for the daily financial routine.

- [x] Transaction entry, edit, delete, list by account/month — **core action**
- [x] Pró-labore transfer (Casa↔Empresa bridge) — **core business rule**
- [x] Monthly budget plan with weekly breakdown — **week-to-week routine**
- [x] Contas fixas auto-populating plan — **eliminates manual repetition**
- [x] Annual expenses ÷ 12 provisioning (IPVA, licenciamento) — **avoids year-end surprise**
- [x] Savings goals with progress bar — **motivation for Reserva de emergência**
- [x] Channels P&L: comissões, anúncios, lucro, retorno per canal — **business health signal**
- [x] 3–6 month cash flow projection with negative alert — **Pronampe + Simples risk visibility**
- [x] Debt progress bars with payment registration — **Pronampe + Simples acompanhamento**
- [x] Dashboard Visão Geral (Casa + Empresa) — **daily landing screen**

### Add After Validation (Etapas 5–7, v1.x)

Add once core tracking loop is working and the user has real data.

- [ ] Calendário de vencimentos com alertas browser — trigger: first time user misses DAS
- [ ] Relatório mensal + PDF export — trigger: first month-end review
- [ ] CSV/OFX import with auto-categorization rules — trigger: user has 30+ days of bank statements to import

### Future Consideration (v2+)

Defer until product-market fit is established or a second user joins.

- [ ] Dark mode — defer per spec
- [ ] WhatsApp alerts — spec explicitly says "futuramente"
- [ ] Multi-empresa — requires multi-tenant architecture
- [ ] Open Finance auto-import — requires Bacen compliance
- [ ] Infoproduto channel — user says "em breve"; add as third Canal when ready

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Lançamento manual + CRUD | HIGH | LOW | P1 |
| Pró-labore transfer | HIGH | LOW | P1 |
| Plano do mês + semanas | HIGH | MEDIUM | P1 |
| Visão geral Casa | HIGH | MEDIUM | P1 |
| Contas fixas auto-plan | HIGH | LOW | P1 |
| Canais P&L (comissão − anúncio) | HIGH | MEDIUM | P1 |
| Fluxo de caixa projetado 3–6 meses | HIGH | HIGH | P1 |
| Dívidas + progress bars | HIGH | MEDIUM | P1 |
| Visão geral Empresa | HIGH | MEDIUM | P1 |
| Gastos anuais ÷ 12 | MEDIUM | LOW | P1 |
| Metas de poupança | MEDIUM | LOW | P1 |
| Calendário de vencimentos + alertas | HIGH | MEDIUM | P2 |
| Relatório mensal PDF | MEDIUM | MEDIUM | P2 |
| CSV/OFX import + regras | MEDIUM | HIGH | P2 |
| PWA lançamento rápido | HIGH | MEDIUM | P2 |
| Dark mode | LOW | MEDIUM | P3 |
| WhatsApp notifications | MEDIUM | HIGH | P3 |

---

## Brazilian-Specific Feature Notes

### DAS do Simples Nacional

- Vence todo dia 20. Hardcode this as a monthly recurring event in the calendar and cash flow projection — do not make it user-configurable for the monthly trigger.
- Value varies: user must enter the DAS amount each month (Simples Nacional calculates it based on revenue, which changes). The system should prompt "Informe o DAS deste mês" around day 15.
- Parcelamento do Simples is separate from the monthly DAS: it is a fixed installment on outstanding tax debt, not the ongoing monthly obligation.

### Pró-labore

- Legally: the owner's salary drawn from the PJ (empresa) and received as PF (casa). In accounting it is a despesa da empresa and a receita da pessoa física.
- In Duas Contas: one Transferência record with conta_origem = Empresa and conta_destino = Casa. Must not appear in faturamento (receita) or in category-based expense reports. It is a bridge, not an income or expense.
- No competitor app in Brazil models this distinction at the consumer level — Mobills and Organizze simply track it as income on the receiving side, losing the connection.

### IPVA e Licenciamento (Goiás)

- IPVA Goiás: paid annually (usually January–March). Licenciamento: annual, date varies.
- The ÷ 12 feature ensures the user reserves monthly, preventing a January cash crisis.
- These belong in Gastos Anuais entity, not in contas fixas (which are monthly).

### Simples Nacional Parcelamento

- Started October 2026 (1ª parcela paga). Fixed monthly installment.
- Vencimento day is user-configurable (confirm in Portal Simples Nacional).
- Distinct from DAS: DAS = ongoing monthly tax; parcelamento = historical debt repayment.

### Shopee / Shein Commission Variability

- Shopee: 3% for existing customers, 15% for new customers. Commission is credited ~30 days after the sale. This lag is important for the cash flow projection.
- Shein: 2% existing, up to 20% new. Similar payment lag.
- The finance tool should track comissões recebidas (cash received), not comissões geradas (sales attributed). These differ due to cancellations and the payment lag.
- ROAS display: retorno = comissões ÷ investimento_anúncio. A retorno of 2.0× means R$ 1 in ads returned R$ 2 in commissions. This is the key metric the user needs to decide whether to scale a channel.

---

## Competitor Feature Analysis

| Feature | Mobills | Organizze | Qipu/Gestão MEI | Duas Contas |
|---------|---------|-----------|-----------------|-------------|
| Personal expense tracking | Yes | Yes | No | Yes |
| Business expense tracking | No | No | Yes | Yes |
| Dual-account with hard wall | No | No | No | **Yes (unique)** |
| Weekly sub-budget | No | No | No | **Yes (unique)** |
| DAS tracking | No | No | Yes | **Yes (combined)** |
| Channel P&L (afiliados) | No | No | No | **Yes (unique)** |
| Cash flow projection | No | No | Basic | **Yes (3–6 months)** |
| Debt progress bars | No | No | No | **Yes** |
| Annual expenses ÷ 12 | No | No | No | **Yes (unique)** |
| Savings goals | Yes (goals) | Basic | No | Yes |
| CSV/OFX import | Paid tier | Paid tier | No | Yes |
| Open Finance integration | Paid tier | Paid tier | No | No (deferred) |
| Monthly report PDF | Yes | Yes | No | Yes |
| Mobile PWA | No (native app) | No (native app) | No (native) | **Yes** |
| Price | Free / R$ 99.90/yr | Paid only | Free / Paid | Personal tool (zero) |

---

## Sources

- [Best Personal Finance Apps in Brazil 2026 — Snabber](https://snabber.com.br/en/blog/best-personal-finance-apps-in-brazil-2026-top-10)
- [Mobills vs Organizze 2026 — Focca-Ai](https://focca-ai.com/melhor-app-financeiro-2026)
- [Aplicativos de gestão financeira para MEI — MaisMei](https://www.maismei.com.br/blog/aplicativos-de-gestao-financeira-para-mei)
- [Controle financeiro MEI: caixa, vendas e DAS — Gestão MEI](https://gestaomei.app.br/)
- [Afiliados Shopee: comissão detalhada — Shopee Blog](https://shopee.com.br/blog/programa-de-afiliados-shopee/)
- [Afiliados Shopee: comissão que come a margem — PuraMargem](https://puramargem.com.br/blog/afiliados-da-shopee-a-comissao-extra-que-come-sua-margem)
- [Comparativo de controles financeiros BR — Financeiro.app](https://www.financeiro.app/blog/comparativo-entre-controles-financeiros/)
- [We Compared 126 Personal Finance App Features — StealWhatWorks](https://stealwhatworks.com/blogs/news/personal-finance-app-features)
- [Best Debt Payoff Apps 2026 — WalletHub](https://wallethub.com/edu/b/best-debt-payoff-plan/153300)
- [Cash Flow Apps for Small Business — Revenued](https://www.revenued.com/articles/business-cash-flow/cash-flow-apps-for-small-business-owners/)

---
*Feature research for: Duas Contas — personal finance + Simples Nacional small business*
*Researched: 28/10/2026*
