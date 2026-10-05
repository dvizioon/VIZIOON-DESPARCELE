import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { DebtRepository } from "../domain/debt-repository";
import { debtHiddenMessage } from "./require-visible-debt";

export async function setDebtReminders(
  debtId: string,
  actorId: string,
  enabled: boolean,
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

  await debts.setRemindersEnabled(debtId, enabled);
  return ok({ ok: true });
}

export async function setDebtRecurringPaused(
  debtId: string,
  actorId: string,
  paused: boolean,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<{ ok: true }>> {
  const debt = await debts.findById(debtId);
  if (!debt) {
    return fail("NOT_FOUND", "Divida nao encontrada");
  }

  if (debt.kind !== "RECURRING" && debt.kind !== "VARIABLE") {
    return fail("VALIDATION", "So divida recorrente ou mensal variavel pode pausar");
  }

  const member = await workspaces.findMember(debt.workspaceId, actorId);
  if (!member || !canEditContent(member)) {
    return fail("FORBIDDEN", "Seu papel so permite visualizar");
  }

  const hidden = debtHiddenMessage(debt, actorId, member);
  if (hidden) {
    return fail("NOT_FOUND", hidden);
  }

  await debts.setRecurringPaused(debtId, paused);
  return ok({ ok: true });
}
