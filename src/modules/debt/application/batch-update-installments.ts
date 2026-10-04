import type { InstallmentRepository } from "@/modules/installment/domain/installment-repository";
import { withDayOfMonth } from "@/shared/utils/date";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { DebtRepository } from "../domain/debt-repository";
import { debtHiddenMessage } from "./require-visible-debt";

export async function batchUpdateInstallments(
  debtId: string,
  actorId: string,
  installmentIds: string[],
  patch: { amountCents?: number; dueDay?: number },
  debts: DebtRepository,
  installments: InstallmentRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<{ updated: number; totalAmountCents: number }>> {
  if (installmentIds.length === 0) {
    return fail("EMPTY", "Selecione pelo menos uma parcela");
  }

  if (patch.amountCents == null && patch.dueDay == null) {
    return fail("EMPTY_PATCH", "Informe valor e/ou dia do vencimento");
  }

  if (patch.amountCents != null && patch.amountCents < 1) {
    return fail("INVALID_AMOUNT", "Valor minimo de R$ 0,01");
  }

  if (patch.dueDay != null && (!Number.isInteger(patch.dueDay) || patch.dueDay < 1 || patch.dueDay > 31)) {
    return fail("INVALID_DAY", "Dia do vencimento entre 1 e 31");
  }

  const debt = await debts.findById(debtId);
  if (!debt) {
    return fail("NOT_FOUND", "Divida nao encontrada");
  }

  const actor = await workspaces.findMember(debt.workspaceId, actorId);
  if (!actor || !canEditContent(actor)) {
    return fail("FORBIDDEN", "Seu papel so permite visualizar");
  }

  const hidden = debtHiddenMessage(debt, actorId, actor);
  if (hidden) {
    return fail("NOT_FOUND", hidden);
  }

  const selected = debt.installments
    .filter((item) => installmentIds.includes(item.id))
    .sort((a, b) => a.number - b.number);

  if (selected.length !== installmentIds.length) {
    return fail("INVALID_IDS", "Alguma parcela nao e desta divida");
  }

  if (patch.amountCents != null) {
    await installments.updateAmounts(
      selected.map((item) => ({ id: item.id, amountCents: patch.amountCents! })),
    );
  }

  if (patch.dueDay != null) {
    await installments.updateDueDates(
      selected.map((item) => ({
        id: item.id,
        dueDate: withDayOfMonth(item.dueDate, patch.dueDay!),
      })),
    );
  }

  const refreshed = await debts.findById(debtId);
  if (!refreshed) {
    return fail("NOT_FOUND", "Divida nao encontrada");
  }

  const totalAmountCents = refreshed.installments.reduce(
    (sum, item) => sum + item.amountCents,
    0,
  );
  await debts.updateTotalAmount(debtId, totalAmountCents);

  return ok({ updated: selected.length, totalAmountCents });
}
