-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PAGO', 'EM_ABERTO');

-- AlterTable
ALTER TABLE "FixedAccount" ADD COLUMN     "isVariableAmount" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "dueDate" DATE,
ADD COLUMN     "estimatedCents" INTEGER,
ADD COLUMN     "fixedAccountId" TEXT,
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PAGO';

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_fixedAccountId_dueDate_key" ON "Transaction"("fixedAccountId", "dueDate");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fixedAccountId_fkey" FOREIGN KEY ("fixedAccountId") REFERENCES "FixedAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

