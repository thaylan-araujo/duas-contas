# Pesquisa — Benchmark de ferramentas de controle financeiro + Assistente de WhatsApp

**Data:** 26/11/2026
**Fonte:** deep-research (28 fontes, 25 afirmações verificadas — 22 confirmadas, 3 derrubadas)
**Objetivo:** identificar o que as melhores ferramentas (BR + globais) têm que o Duas Contas pode adotar/melhorar, com foco em 4 lacunas: rapidez de lançamento, relatórios/insights, projeção/previsão e assistente de WhatsApp com IA.

## TL;DR
As melhores ferramentas se destacam exatamente nas 4 áreas que queremos melhorar. O **assistente de WhatsApp com IA** é o recurso mais diferenciado, é comprovadamente viável, e ainda é premium/pago na maioria dos concorrentes — espaço pra liderar. Concorrente mais direto: **Zaq (zaq-ia.com)** — lança por NL/foto/PDF no WhatsApp e já separa empresa × pessoal. Referência que o usuário quer "copiar": **MeuAssessor** (assistente financeiro no WhatsApp).

## Benchmark por área

### A) Lançamento rápido
Fronteira = captura conversacional/multimodal (frase, áudio, foto de cupom com OCR) + autocategorização que aprende. Copilot: "Name Rules" (se descrição contém X → categoria Y) + IA self-learning (~80–90% de acerto após correções). Assistentes BR de WhatsApp (Magie, Zenofin, Zaq, MeuAssessor) convertem frase solta em lançamento estruturado.

### B) Relatórios e insights
Base = gráficos receita/despesa/categoria, comparação mês a mês, detecção de assinaturas recorrentes. Padrão novo: **Organizze** expõe os dados via conector MCP pro ChatGPT/Claude/Manus (consulta conversacional).

### C) Projeção/previsão
Mecânica comum: projetar o saldo **a partir do saldo atual** usando **obrigações futuras datadas**, pra ver semanas antes quando fica negativo (PocketSmith cenários primário+what-if; YNAB transações sintéticas de recorrentes; Nibo ajustável adiando pagamentos/antecipando recebimentos; Organizze "saldo projetado"). No lado empresa: **previsão de DAS/impostos** pela faixa de faturamento do Simples (Conta Azul, Agilize).

### D) Assistente de WhatsApp com IA
Comprovado e com escala BR (Magie: R$ 1 bi no 1º ano como "banco no WhatsApp"). Arquitetura de prateleira: WhatsApp → IA (intenção + extração de valor/data/categoria/destino) → ramos (lançar NL, OCR de cupom, voz, consulta de relatório, chat) → Postgres.

## Oportunidades priorizadas (impacto × esforço)

| Prioridade | Oportunidade | Impacto | Esforço |
|---|---|---|---|
| 1 | Autocategorização que aprende + regras ("se contém X → categoria Y") | Alto | Baixo |
| 2 | Saldo/caixa projetado (saldo atual + obrigações futuras) + alerta de saldo negativo | Alto | Baixo–Médio |
| 3 | **Assistente de WhatsApp com IA** (lançar por texto/voz/foto + relatórios por chat) | Alto (diferenciação) | Médio |
| 4 | Previsão de DAS por empresa (faixa de faturamento do Simples) | Médio | Médio |
| 5 | Cenários "e se" (compra grande, mudança de pró-labore) | Médio | Médio |

## Assistente de WhatsApp — decisões de design (travadas com o usuário)

- **Escopo:** assistente **financeiro completo primeiro**; arquitetura aberta pra crescer (agenda/tarefas/notas depois como novos "ramos" do roteador).
- **Entrada:** texto + áudio (transcrição) + foto de cupom (OCR).
- **Extração (IA):** valor, data, categoria, tipo (ENTRADA/SAIDA) e **destino** (Casa ou qual empresa).
- **Destino:** o usuário diz na frase ("na Casa", "na Achadinhos"); **se não ficar claro, o bot pergunta** antes de lançar (protege a regra de ouro Casa/empresa).
- **Confirmação:** lança e mostra o resumo ("✓ R$ 50 · Alimentação · Casa"); pergunta só quando a extração ficou incerta.
- **Relatórios por chat:** gasto por categoria · restante da Casa · lucro/faturamento por empresa (P&L) · resumo geral do mês.
- **Open Finance (importar banco):** fase separada depois (junto da importação CSV/OFX do roadmap).
- **Transporte do WhatsApp:** decisão do usuário = **WhatsApp "normal" via Evolution API** (gateway open-source self-hosted, Baileys por baixo; o usuário já tinha experiência), **não** a API oficial da Meta. A Evolution roda em Docker numa VPS barata, mantém a sessão do número (QR) e expõe webhook (recebe) + REST (envia). O nosso app (Vercel, serverless) só recebe o webhook, roda a IA, grava no Supabase e responde via REST da Evolution — **sem servidor sempre-ligado do nosso lado** (quem fica ligado é só a Evolution). Objetivo: custo mínimo (só a VPS + centavos de IA por mensagem).

### Spike (26/11/2026) — extração em PT-BR: ✅ núcleo funciona
Testadas 15 frases reais (empresas Elite Juris/Achadinhos/Infoproduto + Casa). A IA extraiu com segurança valores (R$ 1.234,56, "cinquenta reais"), datas ("ontem"), tipo, e **destino falado**; perguntou quando o destino não foi dito; distinguiu lançamento de pergunta de relatório; tratou multi-item ("almoço 42 e uber 23"). A validar ainda: precisão de **OCR de cupom** e **áudio**, e custo real.

## Caveats / riscos a validar antes do build
- **WhatsApp "normal" (não-oficial):** sem custo de API e sem aprovação da Meta, mas **viola os Termos de Serviço do WhatsApp** → risco de **banimento do número** (baixo para uso pessoal/baixo volume, real em escala). Exige um **processo sempre ativo** mantendo a sessão do WhatsApp Web (login por QR, reconexão) — **não roda em serverless/Vercel**; precisa de um servidor pequeno sempre ligado (VPS). Confiabilidade inferior à API oficial.
- **LGPD:** consentimento por canal; guardar dados financeiros recebidos por WhatsApp exige base legal/consentimento.
- **Precisão PT-BR:** OCR/áudio precisam de spike dedicado; texto já validado.
- **Fontes:** vários dados BR vêm de blogs de fornecedores (corroborados), e preços são sensíveis ao tempo (nov/2026) — reconferir antes de decisão de posicionamento.

## Fontes principais
- Concorrentes BR: zenofin.com.br, organizze.com.br, cora.com.br, zapgastos.com, agilize.com.br, zaq-ia.com, meuassessor.com
- Globais: Copilot (help.copilot.money), PocketSmith (learn.pocketsmith.com), YNAB-forecast (github.com/sil-so/ynab-forecast), Monarch, Nibo
- WhatsApp/IA/LGPD: n8n template 5201, messagecentral.com (pricing/LGPD BR), jota.ai, microsaas.substack.com (Magie)
- Open Finance: pluggy.ai, usecalen.com.br
