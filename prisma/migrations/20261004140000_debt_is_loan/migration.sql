-- AlterTable
ALTER TABLE "Debt" ADD COLUMN "isLoan" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Debt_isLoan_idx" ON "Debt"("isLoan");
