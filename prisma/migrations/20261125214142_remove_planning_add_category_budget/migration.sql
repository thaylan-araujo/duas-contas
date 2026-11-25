-- DropForeignKey
ALTER TABLE "PlanItem" DROP CONSTRAINT "PlanItem_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "PlanItem" DROP CONSTRAINT "PlanItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "WeeklySpend" DROP CONSTRAINT "WeeklySpend_userId_fkey";

-- DropTable
DROP TABLE "PlanItem";

-- DropTable
DROP TABLE "WeeklySpend";

-- CreateTable
CREATE TABLE "CategoryBudget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "limitCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryBudget_userId_month_categoryId_key" ON "CategoryBudget"("userId", "month", "categoryId");

-- AddForeignKey
ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
