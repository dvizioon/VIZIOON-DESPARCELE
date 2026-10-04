import { debtHiddenMessage } from "@/modules/debt/application/require-visible-debt";
import type { DebtRepository } from "@/modules/debt/domain/debt-repository";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { InstallmentRepository } from "../domain/installment-repository";

export async function setInstallmentReminderDisabled(
  installmentId: string,
  actorId: string,
  disabled: boolean,
  installments: InstallmentRepository,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<{ ok: true }>> {
  const installment = await installments.findById(installmentId);
  if (!installment) {
    return fail("NOT_FOUND", "Parcela nao encontrada");
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

  await installments.setReminderDisabled(installmentId, disabled);
  return ok({ ok: true });
}
