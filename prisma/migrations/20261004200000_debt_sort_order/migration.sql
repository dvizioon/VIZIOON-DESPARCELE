-- AlterTable
ALTER TABLE "Debt" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill: ordem atual por createdAt desc (mais nova primeiro) dentro do workspace
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "workspaceId" ORDER BY "createdAt" DESC) - 1 AS rn
  FROM "Debt"
)
UPDATE "Debt" d
SET "sortOrder" = ranked.rn
FROM ranked
WHERE d.id = ranked.id;

-- CreateIndex
CREATE INDEX "Debt_workspaceId_sortOrder_idx" ON "Debt"("workspaceId", "sortOrder");
