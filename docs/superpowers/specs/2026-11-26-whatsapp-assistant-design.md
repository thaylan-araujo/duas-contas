# Design — Assistente de WhatsApp (Duas Contas)

**Data:** 26/11/2026
**Status:** Em revisão (aguardando aprovação do Thaylan)
**Referência de decisões:** `docs/research/2026-11-26-benchmark-controle-financeiro.md` §D e §"decisões travadas"

---

## 1. Intenção e o porquê

O Thaylan quer **lançar gastos e consultar relatórios pelo WhatsApp**, do jeito que o
MeuAssessor faz: manda uma frase ("gastei 50 de gasolina", "paguei 400 de imposto na
Achadinhos") e o sistema entende, lança no lugar certo e confirma; pergunta um relatório
("quanto gastei esse mês?", "lucro da Elite Juris") e o sistema consulta o banco e responde.

**Por quê:** a maior fricção de um app de finanças é **abrir o app e digitar**. O WhatsApp
tira essa fricção — é onde ele já está o dia todo. É também o recurso mais diferenciado do
mercado (a pesquisa mostrou que concorrentes cobram por isso). O objetivo é que lançar vire
tão fácil quanto mandar uma mensagem, pra que os dados do app fiquem sempre atualizados.

## 2. Objetivos (o que precisa funcionar)

- **Lançar por texto:** frase em PT-BR → lançamento estruturado (valor, data, tipo, categoria, destino).
- **Respeitar a regra de ouro Casa × Empresa:** o destino (Casa ou qual empresa) vem da frase;
  **se não ficar claro, o bot pergunta antes de lançar** — nunca adivinha.
- **Confirmar o lançamento:** responde com um resumo curto ("✓ R$ 50 · Combustível · Casa").
- **Relatórios por chat:** gasto por categoria, restante da Casa, lucro/faturamento por empresa (P&L),
  resumo geral do mês.
- **Multi-turno:** quando falta um dado (ex.: destino), o bot pergunta e usa a resposta seguinte.
- **Custo mínimo:** sem API oficial da Meta; só a VPS (que já roda) + centavos de IA por mensagem.
- **Segurança:** só o(s) número(s) autorizado(s) do Thaylan pode(m) lançar/consultar.

## 3. Não-objetivos (fora desta fase)

- Áudio e foto de cupom (OCR) entram em **fatias posteriores** — o texto é validado, áudio/OCR
  precisam de spike próprio (pesquisa §Caveats). O design já deixa o caminho aberto.
- Open Finance / importar extrato do banco — fase separada (junto do CSV/OFX do roadmap).
- Multiusuário / família no WhatsApp — depois (quando o app virar multiusuário).
- Agenda, tarefas, notas — o roteador é extensível, mas esta fase é **só financeiro**.

## 4. Anti-objetivos (o que seria um fracasso mesmo "funcionando")

- **Lançar na conta errada.** Misturar Casa e Empresa é a falha mais grave — melhor perguntar
  do que errar o destino.
- **Lançar um valor errado silenciosamente.** Se a IA ficou em dúvida no valor/categoria, ela
  confirma; não inventa.
- **Depender de servidor sempre-ligado do nosso lado.** O que fica ligado é só a Evolution
  (na VPS); nosso app continua serverless (Vercel).
- **Vazar dados financeiros** pra um número não autorizado.

## 5. Restrições

- **Transporte:** WhatsApp "normal" via **Evolution API** (gateway open-source, Baileys, self-hosted
  na VPS que o Thaylan já mantém). Webhook (recebe) + REST (envia). **Não** é a API oficial da Meta.
  - *Risco aceito:* viola os Termos do WhatsApp → risco de banimento do número (baixo para uso
    pessoal/baixo volume). Mitigação: número dedicado do bot, volume baixo.
- **IA:** modelo barato **Claude Haiku** (bom em PT-BR, centavos por mensagem), via Anthropic SDK.
  Trocável por outro provedor depois (camada isolada).
- **Serverless:** o webhook é um Route Handler do Next.js na Vercel — precisa responder rápido e
  não guardar estado em memória (estado multi-turno vai pro Postgres).
- **LGPD:** guardar dados financeiros vindos do WhatsApp exige base legal/consentimento — registrar
  consentimento do número e tratar os dados como já são tratados no app.
- **PT-BR, R$ 1.234,56, dd/mm/aaaa** em toda resposta do bot.
- **Reusar o que já existe:** lançamentos, pró-labore (par atômico), P&L, restante da Casa,
  consolidado — a lógica financeira já está no app; o bot só a aciona.

## 6. Abordagens consideradas

### A) Webhook no próprio app (Next.js / Vercel) — **ESCOLHIDA**
Evolution → `POST /api/whatsapp/webhook` no nosso app → IA (Anthropic SDK) extrai intenção/dados →
reusa os services de lançamento/relatório → grava no Supabase → responde via REST da Evolution.
- **A favor:** a regra inviolável Casa × Empresa fica em **código TypeScript tipado e testável**
  (Vitest), versionado no repo; reusa os services que já existem; a Vercel já hospeda o app; custo
  fica só na chamada de IA. Um lugar só pra manter.
- **Contra:** limite de tempo da função serverless (resolvido processando inline em <~10s e, se
  preciso, respondendo o ack antes).

### B) Orquestração no n8n (o Thaylan já roda n8n na VPS)
Evolution → fluxo n8n (nó de IA + nós HTTP) → grava no Supabase ou chama uma API interna nossa →
envia pela Evolution.
- **A favor:** menos código, visual, n8n já está de pé.
- **Contra (decisivo):** a **regra de ouro Casa/empresa** — a parte mais crítica do sistema —
  ficaria num fluxo low-code, fora do repo, **difícil de testar e versionar**. Lógica financeira
  espalhada entre app e n8n. Rejeitada por isso.

### C) Micro-serviço dedicado sempre-ligado na VPS
Um serviço Node próprio ao lado da Evolution.
- **A favor:** controle total, sem limite de tempo serverless.
- **Contra:** mais infra pra manter e perde o benefício serverless sem ganho real para este volume.
  Rejeitada.

**Escolha: A.** Mantém a regra crítica em código testado, reusa o app, custo mínimo.

## 7. Arquitetura (a decidida)

```
WhatsApp (número do bot)
   │
   ▼
Evolution API (VPS, Docker) ──webhook──►  POST /api/whatsapp/webhook  (Vercel, nosso app)
   ▲                                          │
   └───────── REST (enviar texto) ◄───────────┤  1. valida segredo do webhook + número na allowlist
                                              │  2. dedupe por id da mensagem (idempotência)
                                              │  3. normaliza → texto (fatia 1: só texto)
                                              │  4. IA (Claude Haiku): intenção + extração (JSON)
                                              │  5. roteia: LANÇAR | RELATÓRIO | ESCLARECER | AJUDA
                                              │  6. executa via services existentes (Prisma/Supabase)
                                              │  7. responde via REST da Evolution
```

- **Endpoint:** `app/api/whatsapp/webhook/route.ts` (POST). Responde 200 rápido.
- **Segurança:** segredo compartilhado no header/URL do webhook + **allowlist de número** (só o
  número do Thaylan transaciona). Número fora da lista → ignora (ou resposta padrão educada).
- **Camada de IA isolada** (`src/lib/whatsapp/ai.ts`): recebe texto + contexto (empresas e categorias
  do usuário) e devolve um objeto validado por **Zod**:
  `{ intent: 'lancar'|'relatorio'|'esclarecer'|'ajuda', tipo?, valorCents?, data?, categoria?, destino?, confianca }`.
  Usa **tool use / saída estruturada** do Claude pra garantir o formato (padrão do spike).
- **Destino = Casa ou uma empresa.** A **Casa é um destino de primeira classe** que mapeia para
  `empresaId = null` (não existe linha `Empresa` pra Casa). É distinto de "destino não informado":
  destino ausente/ambíguo → **pergunta**; "Casa" dito → lança na Casa. O nome da empresa
  ("Achadinhos", "Elite Juris") é mapeado à empresa real por match tolerante.
- **Categoria:** o nome dito ("gasolina") é mapeado a uma categoria **já existente** do destino. Se
  não casar com nenhuma, o bot **pergunta** e oferece as categorias existentes daquele destino —
  **não cria categoria nova por chat nesta fase**. O `kind` da categoria da empresa é inferido do
  tipo (ENTRADA→RECEITA, SAÍDA→CUSTO); na Casa o `kind` é null.
- **Identidade do remetente (hoje single-user):** o número autorizado é ligado ao único usuário
  existente (Thaylan) por uma linha `WhatsappContact` criada no setup (sem tela de cadastro nesta
  fase; consentimento LGPD registrado com data). O webhook é um **chamador server-side confiável**:
  resolve o `userId` pela allowlist e chama os *services* diretamente com esse `userId` (não há
  sessão/cookie no webhook) — essa resolução É a autenticação deste canal. Estrutura fica pronta
  pra virar multiusuário depois.
- **Estado multi-turno:** uma linha de "ação pendente" por número no Postgres (extração parcial +
  expiração curta). A próxima mensagem do número completa a ação. (Serverless não guarda memória.)
- **Idempotência:** registrar o id da mensagem da Evolution; webhook repetido não lança duas vezes.
- **Pró-labore:** reusa o par atômico já existente (SAÍDA empresa + ENTRADA Casa).
- **Relatórios:** reusam os `_lib` existentes (P&L, restante da Casa, dinheiro do mês, consolidado),
  formatados como texto PT-BR.

### Novos dados (schema — aditivo)
- `WhatsappContact`: número → userId, consentimento (LGPD, data), ativo. Allowlist.
- `WhatsappInbound` (log/idempotência): id da mensagem, número, timestamp, processado.
- `WhatsappPendingAction`: número, payload parcial (JSON), tipo de pergunta, expiração.

(Migração aditiva — só adiciona tabelas; backup antes, DIRECT_URL, nunca shadow-db no banco real.)

## 8. Fatias de entrega (ordem)

1. **Fatia 1 — Texto → lançar (núcleo).** Webhook + segurança + allowlist + idempotência +
   IA (texto) + regra de destino (pergunta se incerto) + multi-turno + criar **lançamento simples**
   (gasto/receita numa conta — Casa ou empresa) + confirmação. É o coração; entrega valor sozinha.
   **Pró-labore fica de fora desta fatia.**
2. **Fatia 2 — Pró-labore por chat.** Reconhece "pró-labore da Achadinhos" como operação especial,
   cria o **par atômico** (SAÍDA empresa + ENTRADA Casa) reusando o service existente, com
   **confirmação reforçada** (mostra os dois lados antes/depois). Fatia curta e caprichada por ser
   a parte mais delicada (regra de ouro Casa × Empresa).
3. **Fatia 3 — Relatórios por chat.** Gasto por categoria, restante da Casa, P&L por empresa,
   resumo geral do mês. *(No planejamento, conferir se "restante da Casa" e "resumo geral" já
   existem como funções reusáveis nos `_lib` ou se precisam ser extraídos das páginas.)*
4. **Fatia 4 — Foto de cupom (OCR).** Imagem → Claude (visão) extrai os dados. Spike de precisão antes.
5. **Fatia 5 — Áudio.** Transcrição (ex.: Whisper) → mesmo fluxo de texto. Spike de precisão/custo antes.

Cada fatia é planejada e construída por vez (uma etapa do spec por vez, confirmação entre elas).

## 9. O que fica a critério do builder

- Formato exato do payload da Evolution (ler da instância real) e como extrair o texto/remetente.
- Match tolerante de categoria/empresa (ex.: normalização + similaridade; quando perguntar).
- Esquema fino das tabelas novas e TTL da ação pendente.
- Processar inline × responder ack e processar — conforme o tempo real da função.
- Prompt e formato de saída estruturada do Claude (sobre a base do spike).
- Textos exatos das respostas do bot (tom curto, PT-BR, R$/datas no padrão).

## 10. Pré-requisitos do Thaylan (externos, em paralelo)

- Instância nova na Evolution com **número dedicado do bot** (conectar por QR).
- Apontar o **webhook** da instância pro endpoint do app (com o segredo).
- Variáveis de ambiente na Vercel: `ANTHROPIC_API_KEY`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`,
  `EVOLUTION_INSTANCE`, `WHATSAPP_WEBHOOK_SECRET`, número(s) autorizado(s).

---

*Nada é construído até este documento ser aprovado. Depois da aprovação, o próximo passo é o plano
da Fatia 1 (uma fatia por vez).*
