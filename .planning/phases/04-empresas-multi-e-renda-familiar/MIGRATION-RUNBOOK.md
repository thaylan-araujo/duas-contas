# Runbook de Migração — Fatia 1 (Fundação multi-empresa)

> Rede de segurança da **migração destrutiva do Plano 04-02** (`ContaType` → entidade `Empresa`).
> A migração do Plano 02 vai: `DELETE FROM "Category" WHERE account='EMPRESA'`, adicionar
> `empresaId` nullable em `Category`/`Transaction`, recriar o unique da categoria com
> `NULLS NOT DISTINCT`, dropar a coluna `account` e dropar o type `ContaType`.
>
> **Este documento NÃO executa nenhuma migração.** Ele registra os pré-requisitos de
> segurança (backup + versão do Postgres + contagens antes) exigidos pelo CLAUDE.md
> ("nunca apague dados sem backup") e pela pesquisa (04-RESEARCH §Pitfall 1/3, A1/A2).

---

## 1. Versão do Postgres (A1 — necessário p/ `NULLS NOT DISTINCT`, PG ≥ 15)

Comando (read-only, rodado via DIRECT_URL / porta 5432):

```sql
SELECT version();
```

**Resultado registrado (2026-11-25):**

```
PostgreSQL 17.11 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit
```

✅ **PG 17.11 ≥ 15** — `NULLS NOT DISTINCT` está disponível. O Plano 02 pode usar o índice
`CREATE UNIQUE INDEX ... ON "Category"("name","empresaId","userId") NULLS NOT DISTINCT;`
sem fallback de índices parciais.

---

## 2. Contagens pré-migração (D-07 / A2 — rede de verificação pós-migração)

Comandos (read-only, via DIRECT_URL):

```sql
SELECT count(*) FROM "Transaction" WHERE "account" = 'EMPRESA';  -- esperado: 0 (D-07/A2)
SELECT count(*) FROM "Transaction" WHERE "account" = 'CASA';
SELECT count(*) FROM "Category"    WHERE "account" = 'CASA';
SELECT count(*) FROM "Category"    WHERE "account" = 'EMPRESA';  -- seed antigo a descartar
```

**Resultados registrados (2026-11-25, via `prisma.$queryRaw` com DIRECT_URL):**

| Alvo                              | Contagem ANTES | Esperado DEPOIS da migração (Plano 02)                          |
| --------------------------------- | -------------: | --------------------------------------------------------------- |
| `Transaction` com `account=EMPRESA` |            `0` | — (coluna `account` deixa de existir; 0 linhas, nada a perder)  |
| `Transaction` com `account=CASA`    |            `0` | `0` com `empresaId IS NULL` (nenhuma linha de Casa é perdida)   |
| `Category` com `account=CASA`       |            `5` | `5` com `empresaId IS NULL` (categorias da Casa **preservadas**) |
| `Category` com `account=EMPRESA`    |            `5` | `0` (seed antigo do lado Empresa é **descartado** — D-07)       |

✅ **`Transaction` EMPRESA = 0** — confirma D-07/A2: o lado Empresa está vazio de lançamentos,
então o `DELETE`/drop do Plano 02 **não perde nenhum lançamento real**. As 5 categorias
EMPRESA são apenas o seed antigo (Fornecedores, Anúncios, Taxas e impostos, Pró-labore, Outros),
que será recriado como categorias por empresa.

> Observação: `Transaction CASA = 0` indica que ainda não há lançamentos de teste da Casa;
> as 5 categorias da Casa são o que precisa sobreviver intacto à migração.

---

## 3. Backup ANTES de aplicar a migração do Plano 02 (CLAUDE.md — BLOQUEANTE)

A migração é destrutiva (`DELETE` + `DROP COLUMN` + `DROP TYPE`). Antes de o Plano 02 rodar,
**é obrigatório** ter um backup acessível. Escolha uma das opções:

- **Opção A (dashboard Supabase):** Supabase → Database → Backups → criar/baixar snapshot.
- **Opção B (CLI `pg_dump`, via DIRECT_URL / porta 5432):**

  ```bash
  # Use a DIRECT_URL do .env.local (porta 5432 — nunca o pooler 6543)
  pg_dump "$DIRECT_URL" --format=custom --file=backup-pre-multiempresa-$(date +%Y%m%d).dump
  ```

**Status do backup:** ✅ APROVADO PELO HUMANO em 2026-11-25 (checkpoint bloqueante da Task 1 liberado).

Sinal de resume recebido: **"backup feito, pode migrar"**.

Decisão registrada:

- [x] Checkpoint humano aprovado — migração do Plano 04-02 liberada.
- [x] Versão do Postgres confirmada: **17.11 (≥ 15)** → `NULLS NOT DISTINCT` disponível.
- [x] `Transaction` EMPRESA = 0 confirmado (D-07/A2) — nenhum lançamento real a perder.
- [x] Rede de segurança: projeto em **Supabase Pro com backups automáticos diários**;
      o lado Empresa está vazio e a Casa tem apenas dados de teste (sem dados reais ainda).

> O humano autorizou prosseguir sem snapshot manual adicional, com os backups
> automáticos diários do Supabase Pro como rede. A migração destrutiva em si NÃO
> foi executada neste plano (04-01) — ela pertence ao Plano 04-02.

---

## 4. Verificação PÓS-migração (a ser executada no Plano 02, depois de aplicar)

Rodar as mesmas contagens e conferir contra a tabela da seção 2:

```sql
SELECT count(*) FROM "Category"    WHERE "empresaId" IS NULL;  -- deve ser 5 (Casa preservada)
SELECT count(*) FROM "Transaction" WHERE "empresaId" IS NULL;  -- deve ser 0 (= CASA antes)
-- a coluna "account" e o type "ContaType" não devem mais existir
```

Se `Category` com `empresaId IS NULL` ≠ 5, **parar** e restaurar o backup — dados da Casa
foram perdidos.

---

## 5. Resultado DEPOIS da migração (executado no Plano 04-02 — 2026-11-25)

Contagens pós-migração (read-only, via DIRECT_URL / porta 5432):

| Verificação                            | Valor DEPOIS | Esperado | Status |
| -------------------------------------- | -----------: | -------: | :----: |
| `Category` com `empresaId IS NULL`     |          `5` |      `5` |   ✅   |
| `Transaction` com `empresaId IS NULL`  |          `0` |      `0` |   ✅   |
| colunas `account` restantes            |          `0` |      `0` |   ✅   |
| tipo `ContaType` ainda existe          |          `0` |      `0` |   ✅   |
| índice Casa                            | `Category_name_empresaId_userId_key ... NULLS NOT DISTINCT` | NULLS NOT DISTINCT | ✅ |

✅ A migração estrutural (entidade `Empresa`, `empresaId` nullable, índice NULLS NOT
DISTINCT, DROP de `account`/`ContaType`) aplicou corretamente. A Casa foi restaurada
ao baseline exato (5 categorias, `empresaId NULL`).

> ⚠️ **INCIDENTE registrado (dados de teste):** durante a geração do SQL, o comando
> `prisma migrate diff --shadow-database-url $DIRECT_URL` foi executado apontando o
> **shadow-database-url para o banco REAL**. O Prisma trata o shadow DB como descartável
> e o **resetou**, apagando o seed de teste (1 usuário + 5 categorias CASA + 5 EMPRESA).
> Como o banco continha **apenas dados de teste determinísticos** (runbook §3 — "sem dados
> reais ainda") e o Supabase Pro mantém backups diários, a recuperação foi feita re-rodando
> `npx prisma db seed`, que recria exatamente o baseline da Casa (5 categorias `empresaId NULL`).
> As contagens finais acima batem com a §2 (ANTES). Lição: **nunca** apontar
> `--shadow-database-url` para o banco real; usar um banco descartável separado. Ver
> 04-02-SUMMARY.md §Deviations.

---

## Referências

- CLAUDE.md — "nunca apague dados ou o banco sem me avisar antes; backup antes de qualquer mudança que possa perder dados".
- 04-RESEARCH.md — Pitfall 1 (`NULLS NOT DISTINCT`), Pitfall 3 (backup), A1 (versão PG), A2 (`Transaction` EMPRESA = 0).
- 04-CONTEXT.md — D-07 (recomeço limpo do lado Empresa, dados da Casa preservados).
