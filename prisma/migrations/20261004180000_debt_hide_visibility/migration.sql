-- CreateEnum
CREATE TYPE "DebtHideMode" AS ENUM ('NONE', 'ALL', 'SELECTED');

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN "hideMode" "DebtHideMode" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "DebtHiddenFrom" (
    "debtId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DebtHiddenFrom_pkey" PRIMARY KEY ("debtId","userId")
);

-- CreateIndex
CREATE INDEX "Debt_hideMode_idx" ON "Debt"("hideMode");

-- CreateIndex
CREATE INDEX "DebtHiddenFrom_userId_idx" ON "DebtHiddenFrom"("userId");

-- AddForeignKey
ALTER TABLE "DebtHiddenFrom" ADD CONSTRAINT "DebtHiddenFrom_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtHiddenFrom" ADD CONSTRAINT "DebtHiddenFrom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
