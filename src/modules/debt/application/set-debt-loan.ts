import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import type { Result } from "@/shared/types/result";
import type { DebtRepository } from "../domain/debt-repository";
import { setDebtAutoPay } from "./set-debt-auto-pay";

/** @deprecated use setDebtAutoPay */
export async function setDebtLoan(
  debtId: string,
  actorId: string,
  isLoan: boolean,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<{ ok: true }>> {
  return setDebtAutoPay(debtId, actorId, isLoan, debts, workspaces);
}
