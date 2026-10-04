import type { InstallmentRepository } from "@/modules/installment/domain/installment-repository";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { DebtRepository } from "../domain/debt-repository";

export async function setInstallmentAmount(
  installmentId: string,
  actorId: string,
  amountCents: number,
  debts: DebtRepository,
  installments: InstallmentRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<{ totalAmountCents: number }>> {
  if (amountCents < 1) {
    return fail("INVALID_AMOUNT", "Valor minimo de R$ 0,01");
  }

  const installment = await installments.findById(installmentId);
  if (!installment) {
    return fail("NOT_FOUND", "Parcela nao encontrada");
  }

  const debt = await debts.findById(installment.debtId);
  if (!debt) {
    return fail("NOT_FOUND", "Divida nao encontrada");
  }

  const actor = await workspaces.findMember(debt.workspaceId, actorId);
  if (!actor || !canEditContent(actor)) {
    return fail("FORBIDDEN", "Seu papel so permite visualizar");
  }

  const totalAmountCents = debt.installments.reduce((sum, item) => {
    return sum + (item.id === installmentId ? amountCents : item.amountCents);
  }, 0);

  await installments.updateAmounts([{ id: installmentId, amountCents }]);
  await debts.updateTotalAmount(debt.id, totalAmountCents);

  return ok({ totalAmountCents });
}
