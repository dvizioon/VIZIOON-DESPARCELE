import { debtHiddenMessage } from "@/modules/debt/application/require-visible-debt";
import type { DebtRepository } from "@/modules/debt/domain/debt-repository";
import type { FileStorage } from "@/shared/storage/file-storage";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { InstallmentRepository } from "../domain/installment-repository";

export async function deleteInstallment(
  installmentId: string,
  actorId: string,
  installments: InstallmentRepository,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
  storage: FileStorage,
): Promise<Result<{ debtId: string }>> {
  const installment = await installments.findById(installmentId);
  if (!installment) {
    return fail("NOT_FOUND", "Cobrança nao encontrada");
  }

  const debt = await debts.findById(installment.debtId);
  if (!debt) {
    return fail("NOT_FOUND", "Divida nao encontrada");
  }

  const member = await workspaces.findMember(debt.workspaceId, actorId);
  if (!member || !canEditContent(member)) {
    return fail("FORBIDDEN", "Seu papel so permite visualizar");
  }

  const hidden = debtHiddenMessage(debt, actorId, member);
  if (hidden) {
    return fail("NOT_FOUND", hidden);
  }

  if (debt.installments.length <= 1) {
    return fail("LAST_INSTALLMENT", "Deixe ao menos uma cobrança na divida");
  }

  if (installment.receiptUrl) {
    await storage.remove(installment.receiptUrl);
  }

  await installments.deleteAndRenumber(installmentId);

  return ok({ debtId: debt.id });
}
