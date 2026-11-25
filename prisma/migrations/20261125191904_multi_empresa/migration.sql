-- Migração data-preserving: ContaType (CASA/EMPRESA) → entidade Empresa + empresaId nullable.
-- Hand-editada (04-RESEARCH §Code Examples + Pitfall 1). Ordem crítica:
-- preserva TODAS as categorias/lançamentos da Casa (viram empresaId NULL);
-- descarta apenas o seed vazio do lado EMPRESA (D-07/A2: 0 lançamentos EMPRESA).

-- 1) Nova entidade Empresa + enums
CREATE TYPE "EmpresaTipo" AS ENUM ('AFILIADO', 'JURIDICO_SERVICOS', 'INFOPRODUTO', 'GENERICO');
CREATE TYPE "CategoryKind" AS ENUM ('RECEITA', 'CUSTO');

CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "EmpresaTipo" NOT NULL,
    "cor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Empresa_nome_userId_key" ON "Empresa"("nome", "userId");

ALTER TABLE "Empresa" ADD CONSTRAINT "Empresa_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2) Lado Empresa é vazio (D-07/A2): descartar o seed antigo de categorias EMPRESA.
--    (Transaction EMPRESA já é 0 linhas — nada a apagar; feito ANTES do DROP COLUMN.)
DELETE FROM "Category" WHERE "account" = 'EMPRESA';

-- 3) Adicionar empresaId nullable (NULL = Casa) + kind nullable + FKs Restrict.
--    As linhas CASA restantes ficam com empresaId NULL por default (Casa preservada).
ALTER TABLE "Category"    ADD COLUMN "empresaId" TEXT;
ALTER TABLE "Category"    ADD COLUMN "kind" "CategoryKind";
ALTER TABLE "Transaction" ADD COLUMN "empresaId" TEXT;

ALTER TABLE "Category" ADD CONSTRAINT "Category_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4) CRÍTICO (Pitfall 1): novo unique da categoria com NULLS NOT DISTINCT.
--    Garante unicidade da categoria da Casa quando empresaId é NULL (PG >= 15 / PG 17.11).
DROP INDEX "Category_name_account_userId_key";
CREATE UNIQUE INDEX "Category_name_empresaId_userId_key"
  ON "Category"("name", "empresaId", "userId") NULLS NOT DISTINCT;

-- 5) Remover o eixo antigo (account + ContaType).
ALTER TABLE "Category"    DROP COLUMN "account";
ALTER TABLE "Transaction" DROP COLUMN "account";
DROP TYPE "ContaType";
