-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "EmailBodyFormat" AS ENUM ('HTML', 'TEXT');

-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterEnum
CREATE TYPE "WorkspaceRole_new" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');
ALTER TABLE "WorkspaceMember" ALTER COLUMN "role" TYPE "WorkspaceRole_new" USING (
  CASE WHEN "role"::text = 'MEMBER' THEN 'EDITOR' ELSE "role"::text END
)::"WorkspaceRole_new";
ALTER TYPE "WorkspaceRole" RENAME TO "WorkspaceRole_old";
ALTER TYPE "WorkspaceRole_new" RENAME TO "WorkspaceRole";
DROP TYPE "public"."WorkspaceRole_old";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "systemRole" "SystemRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "DebtNote" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DebtNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtNoteFile" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebtNoteFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailProvider" (
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

-- CreateTable
CREATE TABLE "EmailPurposeRoute" (
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

-- CreateTable
CREATE TABLE "EmailOutbox" (
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

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "allowPublicSignup" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DebtNote_debtId_idx" ON "DebtNote"("debtId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailPurposeRoute_purpose_key" ON "EmailPurposeRoute"("purpose");

-- CreateIndex
CREATE INDEX "EmailPurposeRoute_providerId_idx" ON "EmailPurposeRoute"("providerId");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_createdAt_idx" ON "EmailOutbox"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailOutbox_purpose_idx" ON "EmailOutbox"("purpose");

-- AddForeignKey
ALTER TABLE "DebtNote" ADD CONSTRAINT "DebtNote_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtNote" ADD CONSTRAINT "DebtNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtNoteFile" ADD CONSTRAINT "DebtNoteFile_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "DebtNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailPurposeRoute" ADD CONSTRAINT "EmailPurposeRoute_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "EmailProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "EmailProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

