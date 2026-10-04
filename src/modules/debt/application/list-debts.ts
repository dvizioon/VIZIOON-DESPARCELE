import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import { matchesOwnerFilter, type DebtOwnerFilter, type DebtWithInstallments } from "../domain/debt";
import type { DebtRepository } from "../domain/debt-repository";

export async function listDebts(
  workspaceId: string,
  actorId: string,
  filter: DebtOwnerFilter,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<DebtWithInstallments[]>> {
  const member = await workspaces.findMember(workspaceId, actorId);
  if (!member) {
    return fail("FORBIDDEN", "Voce nao faz parte deste espaco");
  }

  const items = await debts.listByWorkspace(workspaceId);
  return ok(items.filter((debt) => matchesOwnerFilter(debt, actorId, filter)));
}
