import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { DebtRepository } from "../domain/debt-repository";

export async function reorderDebts(
  workspaceId: string,
  actorId: string,
  orderedIds: string[],
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<{ ok: true }>> {
  const member = await workspaces.findMember(workspaceId, actorId);
  if (!member || !canEditContent(member)) {
    return fail("FORBIDDEN", "Seu papel so permite visualizar");
  }

  if (orderedIds.length === 0) {
    return fail("EMPTY", "Lista vazia");
  }

  const unique = [...new Set(orderedIds)];
  if (unique.length !== orderedIds.length) {
    return fail("VALIDATION", "Ids duplicados");
  }

  await debts.reorder(workspaceId, orderedIds);
  return ok({ ok: true });
}
