import { debtHiddenMessage } from "@/modules/debt/application/require-visible-debt";
import type { DebtRepository } from "@/modules/debt/domain/debt-repository";
import { addMonths } from "@/shared/utils/date";
import type { FileStorage } from "@/shared/storage/file-storage";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { Installment } from "../domain/installment";
import type { InstallmentRepository } from "../domain/installment-repository";

export async function addDebtInstallment(
  debtId: string,
  actorId: string,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<Installment>> {
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

  if (debt.installments.length >= 360) {
    return fail("LIMIT", "Limite de parcelas atingido");
  }

  const last = [...debt.installments].sort((a, b) => b.number - a.number)[0];
  if (!last) {
    return fail("NOT_FOUND", "Divida sem parcelas");
  }

  const updated = await debts.appendInstallment(debtId, {
    number: last.number + 1,
    amountCents: last.amountCents,
    dueDate: addMonths(last.dueDate, 1),
    status: "PENDING",
  });

  const created = updated.installments.find((item) => item.number === last.number + 1);
  if (!created) {
    return fail("CREATE_FAILED", "Nao foi possivel criar a parcela");
  }

  return ok(created);
}

export async function reorderDebtInstallments(
  debtId: string,
  actorId: string,
  orderedIds: string[],
  debts: DebtRepository,
  installments: InstallmentRepository,
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

  if (orderedIds.length !== debt.installments.length) {
    return fail("INVALID_ORDER", "Ordem invalida");
  }

  const known = new Set(debt.installments.map((item) => item.id));
  if (orderedIds.some((id) => !known.has(id))) {
    return fail("INVALID_ORDER", "Ordem invalida");
  }

  try {
    await installments.reorderByIds(debtId, orderedIds);
  } catch {
    return fail("INVALID_ORDER", "Nao foi possivel reordenar");
  }

  return ok({ ok: true });
}

export async function batchDeleteInstallments(
  debtId: string,
  actorId: string,
  installmentIds: string[],
  debts: DebtRepository,
  installments: InstallmentRepository,
  workspaces: WorkspaceRepository,
  storage: FileStorage,
): Promise<Result<{ deleted: number }>> {
  if (installmentIds.length === 0) {
    return fail("EMPTY", "Selecione pelo menos uma parcela");
  }

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

  const selected = debt.installments.filter((item) => installmentIds.includes(item.id));
  if (selected.length !== installmentIds.length) {
    return fail("INVALID_IDS", "Alguma parcela nao e desta divida");
  }

  if (debt.installments.length - selected.length < 1) {
    return fail("LAST_INSTALLMENT", "Deixe ao menos uma cobrança na divida");
  }

  for (const item of selected) {
    if (item.receiptUrl) {
      await storage.remove(item.receiptUrl);
    }
  }

  try {
    await installments.deleteManyAndRenumber(
      debtId,
      selected.map((item) => item.id),
    );
  } catch {
    return fail("LAST_INSTALLMENT", "Deixe ao menos uma cobrança na divida");
  }

  return ok({ deleted: selected.length });
}
