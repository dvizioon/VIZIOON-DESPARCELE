import { PrismaAdminRepository } from "@/modules/admin/infrastructure/prisma-admin-repository";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { PrismaMailRepository } from "@/modules/mail/infrastructure/prisma-mail-repository";
import { PrismaDebtRepository } from "@/modules/debt/infrastructure/prisma-debt-repository";
import { PrismaInstallmentRepository } from "@/modules/installment/infrastructure/prisma-installment-repository";
import { PrismaNoteRepository } from "@/modules/note/infrastructure/prisma-note-repository";
import { PrismaWorkspaceRepository } from "@/modules/workspace/infrastructure/prisma-workspace-repository";
import { createFileStorage } from "@/shared/storage/create-file-storage";

export function getRepositories() {
  return {
    users: new PrismaUserRepository(),
    admin: new PrismaAdminRepository(),
    mail: new PrismaMailRepository(),
    workspaces: new PrismaWorkspaceRepository(),
    debts: new PrismaDebtRepository(),
    installments: new PrismaInstallmentRepository(),
    notes: new PrismaNoteRepository(),
    storage: createFileStorage(),
  };
}
