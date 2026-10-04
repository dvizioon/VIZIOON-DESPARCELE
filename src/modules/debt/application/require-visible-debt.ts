import { isAdmin, type WorkspaceMember } from "@/modules/workspace/domain/workspace";
import { isDebtVisibleTo, type Debt } from "../domain/debt";

/** null = ok; senão mensagem genérica (não vaza existência). */
export function debtHiddenMessage(
  debt: Pick<Debt, "hideMode" | "hiddenUserIds">,
  actorId: string,
  member: WorkspaceMember,
): string | null {
  if (isDebtVisibleTo(debt, actorId, isAdmin(member))) {
    return null;
  }

  return "Divida nao encontrada";
}
