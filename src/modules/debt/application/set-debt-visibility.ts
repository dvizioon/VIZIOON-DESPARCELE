import { isAdmin } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { DebtHideMode } from "../domain/debt";
import type { DebtRepository } from "../domain/debt-repository";

export async function setDebtVisibility(
  debtId: string,
  actorId: string,
  hideModeRaw: string,
  hiddenUserIds: string[],
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<{ ok: true }>> {
  const debt = await debts.findById(debtId);
  if (!debt) {
    return fail("NOT_FOUND", "Divida nao encontrada");
  }

  const member = await workspaces.findMember(debt.workspaceId, actorId);
  if (!member || !isAdmin(member)) {
    return fail("FORBIDDEN", "So administrador pode ocultar divida");
  }

  const hideMode = parseHideMode(hideModeRaw);
  if (!hideMode) {
    return fail("VALIDATION", "Modo de ocultacao invalido");
  }

  if (hideMode === "SELECTED") {
    const members = await workspaces.listMembers(debt.workspaceId);
    const memberIds = new Set(members.map((item) => item.userId));
    const selected = [...new Set(hiddenUserIds)].filter(
      (userId) => userId !== actorId && memberIds.has(userId),
    );

    if (selected.length === 0) {
      await debts.setVisibility(debtId, "NONE", []);
      return ok({ ok: true });
    }

    await debts.setVisibility(debtId, "SELECTED", selected);
    return ok({ ok: true });
  }

  await debts.setVisibility(debtId, hideMode, []);
  return ok({ ok: true });
}

function parseHideMode(value: string): DebtHideMode | null {
  if (value === "NONE" || value === "ALL" || value === "SELECTED") {
    return value;
  }

  return null;
}
