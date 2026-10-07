-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN "signupFieldName" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SystemConfig" ADD COLUMN "signupFieldEmail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "SystemConfig" ADD COLUMN "signupFieldPhone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SystemConfig" ADD COLUMN "signupFieldPassword" BOOLEAN NOT NULL DEFAULT true;
