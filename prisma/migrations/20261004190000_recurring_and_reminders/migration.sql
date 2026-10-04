-- CreateEnum
CREATE TYPE "DebtKind" AS ENUM ('INSTALLMENT', 'RECURRING');

-- AlterEnum
ALTER TYPE "CronTaskType" ADD VALUE 'RECURRING_GENERATE';
ALTER TYPE "CronTaskType" ADD VALUE 'INSTALLMENT_REMINDER';

-- Rename isLoan -> autoPay
ALTER TABLE "Debt" RENAME COLUMN "isLoan" TO "autoPay";
ALTER INDEX "Debt_isLoan_idx" RENAME TO "Debt_autoPay_idx";

-- AlterTable Debt
ALTER TABLE "Debt" ADD COLUMN "kind" "DebtKind" NOT NULL DEFAULT 'INSTALLMENT';
ALTER TABLE "Debt" ADD COLUMN "remindersEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Debt" ADD COLUMN "recurringAmount" DECIMAL(12,2);
ALTER TABLE "Debt" ADD COLUMN "recurringDay" INTEGER;
ALTER TABLE "Debt" ADD COLUMN "recurringPausedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Debt_kind_idx" ON "Debt"("kind");

-- AlterTable Installment
ALTER TABLE "Installment" ADD COLUMN "reminderDisabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Installment" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
ALTER TABLE "Installment" ADD COLUMN "overdueReminderSentAt" TIMESTAMP(3);

-- AlterTable SystemConfig
ALTER TABLE "SystemConfig" ADD COLUMN "reminderCronEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SystemConfig" ADD COLUMN "reminderDaysBefore" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "SystemConfig" ADD COLUMN "reminderCronHour" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "SystemConfig" ADD COLUMN "recurringCronEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SystemConfig" ADD COLUMN "recurringCronHour" INTEGER NOT NULL DEFAULT 5;
