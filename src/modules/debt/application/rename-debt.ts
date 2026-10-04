import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { DebtRepository } from "../domain/debt-repository";

export async function renameDebt(
  debtId: string,
  actorId: string,
  name: string,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<{ name: string }>> {
  const debt = await debts.findById(debtId);
  if (!debt) {
    return fail("NOT_FOUND", "Divida nao encontrada");
  }

  const member = await workspaces.findMember(debt.workspaceId, actorId);
  if (!member || !canEditContent(member)) {
    return fail("FORBIDDEN", "Seu papel so permite visualizar");
  }

  const nextName = name.trim();
  if (nextName.length < 2) {
    return fail("INVALID_NAME", "Informe o nome da divida");
  }

  await debts.rename(debtId, nextName);
  return ok({ name: nextName });
}
