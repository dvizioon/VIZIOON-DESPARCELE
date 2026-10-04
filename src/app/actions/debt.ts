"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDebt } from "@/modules/debt/application/create-debt";
import { createDebtNote } from "@/modules/note/application/create-note";
import { requireUser } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";
import { parseDateInput } from "@/shared/utils/date";
import { isEmptyHtml } from "@/shared/utils/html";
import { parseBRLInput } from "@/shared/utils/money";
import type { ActionState } from "./auth";

export async function createDebtAction(
  workspaceId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, workspaces, notes, storage } = getRepositories();

  let totalAmountCents = 0;
  let firstDueDate: Date;
  let firstAmountCents: number | undefined;

  try {
    totalAmountCents = parseBRLInput(String(formData.get("totalAmount") ?? ""));
    firstDueDate = parseDateInput(String(formData.get("firstDueDate") ?? ""));
    const firstRaw = String(formData.get("firstAmount") ?? "").trim();
    if (firstRaw) {
      firstAmountCents = parseBRLInput(firstRaw);
    }
  } catch {
    return { error: "Valor ou data invalidos" };
  }

  const result = await createDebt(
    {
      workspaceId,
      actorId: user.id,
      name: String(formData.get("name") ?? ""),
      totalAmountCents,
      installmentCount: Number(formData.get("installmentCount") ?? 0),
      isLoan: String(formData.get("isLoan") ?? "") === "1",
      ownerId: String(formData.get("ownerId") ?? user.id),
      firstDueDate,
      firstAmountCents,
    },
    debts,
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  const noteHtml = String(formData.get("note") ?? "");
  if (!isEmptyHtml(noteHtml)) {
    await createDebtNote(
      result.value.id,
      user.id,
      noteHtml,
      [],
      notes,
      debts,
      workspaces,
      storage,
    );
  }

  redirect(`/w/${workspaceId}/debts/${result.value.id}`);
}

export async function markPaidAction(
  workspaceId: string,
  debtId: string,
  installmentId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { installments, debts, workspaces, storage } = getRepositories();
  const { markInstallmentPaid } = await import(
    "@/modules/installment/application/mark-installment-paid"
  );

  const file = formData.get("receipt");
  let receipt: { buffer: Buffer; filename: string; mimeType: string } | null = null;

  if (file instanceof File && file.size > 0) {
    receipt = {
      buffer: Buffer.from(await file.arrayBuffer()),
      filename: file.name,
      mimeType: file.type,
    };
  }

  const result = await markInstallmentPaid(
    { installmentId, actorId: user.id, receipt },
    installments,
    debts,
    workspaces,
    storage,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null };
}

async function revalidateDebtPaths(workspaceId: string, debtId: string): Promise<void> {
  revalidatePath(`/w/${workspaceId}`);
  revalidatePath(`/w/${workspaceId}/debts`);
  revalidatePath(`/w/${workspaceId}/debts/${debtId}`);
}

export async function revertPaidAction(
  workspaceId: string,
  debtId: string,
  installmentId: string,
): Promise<ActionState> {
  const user = await requireUser();
  const { installments, debts, workspaces, storage } = getRepositories();
  const { revertInstallmentPaid } = await import(
    "@/modules/installment/application/revert-installment-paid"
  );

  const result = await revertInstallmentPaid(
    installmentId,
    user.id,
    installments,
    debts,
    workspaces,
    storage,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null };
}

export async function removeReceiptAction(
  workspaceId: string,
  debtId: string,
  installmentId: string,
): Promise<ActionState> {
  const user = await requireUser();
  const { installments, debts, workspaces, storage } = getRepositories();
  const { removeInstallmentReceipt } = await import(
    "@/modules/installment/application/remove-installment-receipt"
  );

  const result = await removeInstallmentReceipt(
    installmentId,
    user.id,
    installments,
    debts,
    workspaces,
    storage,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null };
}

export async function deleteDebtAction(
  workspaceId: string,
  debtId: string,
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, workspaces, notes, storage } = getRepositories();
  const { deleteDebt } = await import("@/modules/debt/application/delete-debt");

  const result = await deleteDebt(debtId, user.id, debts, workspaces, notes, storage);

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath(`/w/${workspaceId}`);
  revalidatePath(`/w/${workspaceId}/debts`);
  redirect(`/w/${workspaceId}/debts`);
}

export async function renameDebtAction(
  workspaceId: string,
  debtId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, workspaces } = getRepositories();
  const { renameDebt } = await import("@/modules/debt/application/rename-debt");

  const result = await renameDebt(
    debtId,
    user.id,
    String(formData.get("name") ?? ""),
    debts,
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null, ok: true };
}

export async function setDebtLoanAction(
  workspaceId: string,
  debtId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, workspaces } = getRepositories();
  const { setDebtLoan } = await import("@/modules/debt/application/set-debt-loan");

  const result = await setDebtLoan(
    debtId,
    user.id,
    String(formData.get("isLoan") ?? "") === "1",
    debts,
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null, ok: true };
}

export async function setInstallmentAmountAction(
  workspaceId: string,
  debtId: string,
  installmentId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, installments, workspaces } = getRepositories();
  const { setInstallmentAmount } = await import(
    "@/modules/debt/application/set-installment-amount"
  );

  let amountCents = 0;
  try {
    amountCents = parseBRLInput(String(formData.get("amount") ?? ""));
  } catch {
    return { error: "Valor da parcela invalido" };
  }

  const result = await setInstallmentAmount(
    installmentId,
    user.id,
    amountCents,
    debts,
    installments,
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null, ok: true };
}
