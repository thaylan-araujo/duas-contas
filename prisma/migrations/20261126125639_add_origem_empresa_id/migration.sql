-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "origemEmpresaId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_origemEmpresaId_idx" ON "Transaction"("origemEmpresaId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_origemEmpresaId_fkey" FOREIGN KEY ("origemEmpresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
