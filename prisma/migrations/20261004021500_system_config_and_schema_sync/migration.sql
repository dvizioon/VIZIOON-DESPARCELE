-- Recovery: a tentativa anterior commitou parte do schema (ex.: SystemRole)
-- e marcou a migration como failed. Reaplicar precisa tolerar o que já existe.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "SystemRole" AS ENUM ('MEMBER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EmailBodyFormat" AS ENUM ('HTML', 'TEXT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EmailOutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum WorkspaceRole (MEMBER -> EDITOR/VIEWER), só se ainda precisar
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'WorkspaceRole' AND e.enumlabel = 'MEMBER'
  ) OR (
    EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceRole')
    AND NOT EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'WorkspaceRole' AND e.enumlabel = 'EDITOR'
    )
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceRole_new') THEN
      CREATE TYPE "WorkspaceRole_new" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');
    END IF;

    ALTER TABLE "WorkspaceMember" ALTER COLUMN "role" TYPE "WorkspaceRole_new" USING (
      CASE WHEN "role"::text = 'MEMBER' THEN 'EDITOR' ELSE "role"::text END
    )::"WorkspaceRole_new";

    DROP TYPE IF EXISTS "WorkspaceRole" CASCADE;
    ALTER TYPE "WorkspaceRole_new" RENAME TO "WorkspaceRole";
  END IF;
END $$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "systemRole" "SystemRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE IF NOT EXISTS "DebtNote" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DebtNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DebtNoteFile" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DebtNoteFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "password" TEXT,
    "fromAddress" TEXT NOT NULL,
    "replyTo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailPurposeRoute" (
    "id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "providerId" TEXT,
    "subjectTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "bodyFormat" "EmailBodyFormat" NOT NULL DEFAULT 'HTML',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailPurposeRoute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "EmailOutbox" (
    "id" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "providerId" TEXT,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "format" "EmailBodyFormat" NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "variables" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SystemConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "allowPublicSignup" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DebtNote_debtId_idx" ON "DebtNote"("debtId");
CREATE UNIQUE INDEX IF NOT EXISTS "EmailPurposeRoute_purpose_key" ON "EmailPurposeRoute"("purpose");
CREATE INDEX IF NOT EXISTS "EmailPurposeRoute_providerId_idx" ON "EmailPurposeRoute"("providerId");
CREATE INDEX IF NOT EXISTS "EmailOutbox_status_createdAt_idx" ON "EmailOutbox"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "EmailOutbox_purpose_idx" ON "EmailOutbox"("purpose");

DO $$ BEGIN
  ALTER TABLE "DebtNote" ADD CONSTRAINT "DebtNote_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DebtNote" ADD CONSTRAINT "DebtNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "DebtNoteFile" ADD CONSTRAINT "DebtNoteFile_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "DebtNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EmailPurposeRoute" ADD CONSTRAINT "EmailPurposeRoute_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "EmailProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "EmailProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
