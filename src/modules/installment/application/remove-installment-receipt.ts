import type { DebtRepository } from "@/modules/debt/domain/debt-repository";
import type { FileStorage } from "@/shared/storage/file-storage";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { Installment } from "../domain/installment";
import type { InstallmentRepository } from "../domain/installment-repository";

export async function removeInstallmentReceipt(
  installmentId: string,
  actorId: string,
  installments: InstallmentRepository,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
  storage: FileStorage,
): Promise<Result<Installment>> {
  const installment = await installments.findById(installmentId);
  if (!installment) {
    return fail("NOT_FOUND", "Parcela nao encontrada");
  }

  if (!installment.receiptUrl) {
    return fail("NO_RECEIPT", "Essa parcela nao tem comprovante");
  }

  const debt = await debts.findById(installment.debtId);
  if (!debt) {
    return fail("NOT_FOUND", "Divida nao encontrada");
  }

  const member = await workspaces.findMember(debt.workspaceId, actorId);
  if (!member || !canEditContent(member)) {
    return fail("FORBIDDEN", "Seu papel so permite visualizar");
  }

  await storage.remove(installment.receiptUrl);
  const updated = await installments.clearReceipt(installmentId);
  return ok(updated);
}
