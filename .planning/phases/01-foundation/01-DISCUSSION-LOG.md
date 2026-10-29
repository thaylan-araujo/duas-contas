# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-29
**Phase:** 1-Foundation
**Areas discussed:** Schema Prisma, Criação do usuário Thaylan, Shell da aplicação, Seeds e dados iniciais

---

## Schema Prisma

| Option | Description | Selected |
|--------|-------------|----------|
| Só o necessário para Fase 1+2 | User, Account, Transaction, Category. Fases 3-8 adicionam via migration. | ✓ |
| Schema completo de uma vez | Todos os ~15 modelos agora. Sem migrations futuras, mas risco maior. | |
| Claude decide | Delegar ao agente de planejamento. | |

**User's choice:** Schema mínimo para Fase 1+2
**Notes:** Menos risco na primeira migration, mais fácil de revisar.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Não, só o id do Supabase | User é só referência para FK. Supabase Auth guarda email/senha. | ✓ |
| Sim, nome de exibição também | Campo displayName no User para "Olá, Thaylan". | |
| Claude decide | Com base no design das telas. | |

**User's choice:** Não, só o id do Supabase Auth
**Notes:** Evita duplicação com Supabase Auth. displayName deferred para possível adição futura.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Por conta (Casa vs. Empresa) | Category tem campo account (CASA \| EMPRESA). | ✓ |
| Globais com tag opcional | Categoria global com tag de conta opcional. | |

**User's choice:** Por conta (Casa vs. Empresa)
**Notes:** Espelha a regra de negócio central — as duas contas nunca se misturam.

---

## Criação do usuário Thaylan

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Dashboard + script seed | Cria usuário no painel do Supabase + seed.ts espelho no Prisma. | ✓ |
| Rota /setup temporária | Rota que cria o primeiro usuário e se desativa. | |
| Variável de ambiente SEED_EMAIL/PASSWORD | Script lê vars e usa Supabase Admin API. | |

**User's choice:** Supabase Dashboard + script seed
**Notes:** Zero código de signup no app. Mais simples e seguro para uso pessoal.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Magic link por email | Fluxo nativo do Supabase Auth. Zero implementação extra. | ✓ |
| Reset pelo Supabase Dashboard | Reset manual pelo painel — sem fluxo no app. | |
| Claude decide | Escolher o mais simples. | |

**User's choice:** Magic link por email
**Notes:** Supabase Auth já tem esse fluxo pronto.

---

## Shell da aplicação na Fase 1

| Option | Description | Selected |
|--------|-------------|----------|
| Shell completa com menus e placeholders | Sidebar, todas as seções, telas "Em breve". App parece real desde a Fase 1. | ✓ |
| Só a infraestrutura (login + middleware) | Só auth + banco + utils. Nenhum menu ainda. | |

**User's choice:** Shell completa com menus e placeholders
**Notes:** É o que o spec original previa na Etapa 1.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom navigation bar | Barra de ícones na parte inferior — padrão mobile moderno. | ✓ |
| Top bar com menu hamburguer | Barra no topo com botão de menu. | |
| Claude decide | Com base no design das telas no PDF. | |

**User's choice:** Bottom navigation bar
**Notes:** Mais fácil de alcançar com uma mão. Compatível com PWA.

---

## Seeds e dados iniciais

| Option | Description | Selected |
|--------|-------------|----------|
| Na Fase 1, junto com o usuário | Seed insere categorias padrão da Casa e Empresa na Fase 1. | ✓ |
| Na Fase 2, com os formulários | Categorias ficam hardcoded junto com as telas de lançamentos. | |

**User's choice:** Na Fase 1, junto com o usuário
**Notes:** Formulários da Fase 2 já terão categorias disponíveis.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Na fase correspondente (Fase 4/3) | Dívidas na Fase 4, metas na Fase 3. Mais modular. | ✓ |
| Tudo na Fase 1 | Um único seed insere tudo. Mais trabalho na Fase 1. | |

**User's choice:** Na fase correspondente
**Notes:** Dívidas (Pronampe, Simples) na Fase 4. Metas ("Reserva de emergência", "Caixinha do carro") na Fase 3.

---

## Claude's Discretion

- Estrutura interna de cada route (feature-per-route colocation está definida, mas organização interna pode ser decidida no planejamento)
- Nomes exatos das categorias padrão (usar spec.md como referência)
- Quantidade e nomes das seções no bottom navigation bar (priorizar as mais usadas)

## Deferred Ideas

- displayName do usuário ("Olá, Thaylan") — não crítico para MVP, pode ser adicionado na Fase 2 ou v2
- Tema escuro — Out of Scope no REQUIREMENTS.md
- Multi-usuário / multi-empresa — Out of Scope, mas arquitetura com userId em todas as tabelas permite evolução futura
