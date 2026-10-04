-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "loanCronEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "loanCronHour" INTEGER NOT NULL DEFAULT 6;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CronTaskType" AS ENUM ('LOAN_AUTO_PAY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CronTaskStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "CronTask" (
    "id" TEXT NOT NULL,
    "type" "CronTaskType" NOT NULL,
    "status" "CronTaskStatus" NOT NULL DEFAULT 'PENDING',
    "runDate" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "paidCount" INTEGER,
    "message" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CronTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CronTask_type_runDate_key" ON "CronTask"("type", "runDate");
CREATE INDEX IF NOT EXISTS "CronTask_status_scheduledFor_idx" ON "CronTask"("status", "scheduledFor");
CREATE INDEX IF NOT EXISTS "CronTask_type_createdAt_idx" ON "CronTask"("type", "createdAt");
