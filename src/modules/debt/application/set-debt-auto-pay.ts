import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { DebtRepository } from "../domain/debt-repository";
import { debtHiddenMessage } from "./require-visible-debt";

export async function setDebtAutoPay(
  debtId: string,
  actorId: string,
  autoPay: boolean,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<{ ok: true }>> {
  const debt = await debts.findById(debtId);
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

  await debts.setAutoPay(debtId, autoPay);
  return ok({ ok: true });
}
