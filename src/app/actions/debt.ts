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

  let firstDueDate: Date;
  let installmentAmountsCents: number[] | undefined;
  let installmentDueDates: Date[] | undefined;
  let installmentPaidFlags: boolean[] | undefined;
  let totalAmountCents: number | undefined;

  try {
    firstDueDate = parseDateInput(String(formData.get("firstDueDate") ?? ""));
    const amountsRaw = String(formData.get("installmentAmounts") ?? "").trim();
    if (amountsRaw) {
      installmentAmountsCents = amountsRaw.split(",").map((part) => {
        const n = Number(part);
        if (!Number.isFinite(n) || n < 1) {
          throw new Error("invalid");
        }
        return Math.round(n);
      });
    }
    const datesRaw = String(formData.get("installmentDueDates") ?? "").trim();
    if (datesRaw) {
      installmentDueDates = datesRaw.split(",").map((part) => parseDateInput(part));
    }
    const paidRaw = String(formData.get("installmentPaidFlags") ?? "").trim();
    if (paidRaw) {
      installmentPaidFlags = paidRaw.split(",").map((part) => part === "1");
    }
    const totalRaw = String(formData.get("totalAmount") ?? "").trim();
    if (totalRaw) {
      totalAmountCents = parseBRLInput(totalRaw);
    }
  } catch {
    return { error: "Valor ou data invalidos" };
  }

  const kindRaw = String(formData.get("kind") ?? "INSTALLMENT");
  const kind =
    kindRaw === "RECURRING" ? "RECURRING" : kindRaw === "VARIABLE" ? "VARIABLE" : "INSTALLMENT";
  let recurringAmountCents: number | undefined;
  const recurringRaw = String(formData.get("recurringAmount") ?? "").trim();
  if (recurringRaw) {
    try {
      recurringAmountCents = parseBRLInput(recurringRaw);
    } catch {
      return { error: "Valor mensal invalido" };
    }
  } else if (kind === "VARIABLE") {
    recurringAmountCents = 0;
  }

  const alreadyPaidCount = Number(formData.get("alreadyPaidCount") ?? 0);
  const isMonthly = kind === "RECURRING" || kind === "VARIABLE";

  const result = await createDebt(
    {
      workspaceId,
      actorId: user.id,
      name: String(formData.get("name") ?? ""),
      kind,
      totalAmountCents,
      installmentCount: Number(formData.get("installmentCount") ?? (isMonthly ? 1 : 0)),
      autoPay: String(formData.get("autoPay") ?? formData.get("isLoan") ?? "") === "1",
      remindersEnabled: String(formData.get("remindersEnabled") ?? "") === "1",
      recurringAmountCents,
      recurringDay: Number(formData.get("recurringDay") ?? 0) || undefined,
      alreadyPaidCount: Number.isFinite(alreadyPaidCount) ? alreadyPaidCount : 0,
      ownerId: String(formData.get("ownerId") ?? user.id),
      firstDueDate,
      installmentAmountsCents,
      installmentDueDates,
      installmentPaidFlags,
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

  revalidatePath(`/w/${workspaceId}`);
  revalidatePath(`/w/${workspaceId}/debts`);
  revalidatePath(`/w/${workspaceId}/debts/${result.value.id}`);
  // Sem redirect aqui: useActionState + redirect deixa "Salvando..." preso.
  return { error: null, ok: true, debtId: result.value.id };
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

export async function deleteInstallmentAction(
  workspaceId: string,
  debtId: string,
  installmentId: string,
): Promise<ActionState> {
  const user = await requireUser();
  const { installments, debts, workspaces, storage } = getRepositories();
  const { deleteInstallment } = await import(
    "@/modules/installment/application/delete-installment"
  );

  const result = await deleteInstallment(
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

export async function reorderDebtsAction(
  workspaceId: string,
  orderedIds: string[],
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, workspaces } = getRepositories();
  const { reorderDebts } = await import("@/modules/debt/application/reorder-debts");

  const result = await reorderDebts(workspaceId, user.id, orderedIds, debts, workspaces);
  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath(`/w/${workspaceId}`);
  revalidatePath(`/w/${workspaceId}/debts`);
  return { error: null, ok: true };
}

export async function setDebtLoanAction(
  workspaceId: string,
  debtId: string,
  formData: FormData,
): Promise<ActionState> {
  return setDebtAutoPayAction(workspaceId, debtId, formData);
}

export async function setDebtAutoPayAction(
  workspaceId: string,
  debtId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, workspaces } = getRepositories();
  const { setDebtAutoPay } = await import("@/modules/debt/application/set-debt-auto-pay");

  const result = await setDebtAutoPay(
    debtId,
    user.id,
    String(formData.get("autoPay") ?? formData.get("isLoan") ?? "") === "1",
    debts,
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null, ok: true };
}

export async function setDebtRemindersAction(
  workspaceId: string,
  debtId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, workspaces } = getRepositories();
  const { setDebtReminders } = await import("@/modules/debt/application/set-debt-reminders");

  const result = await setDebtReminders(
    debtId,
    user.id,
    String(formData.get("remindersEnabled") ?? "") === "1",
    debts,
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null, ok: true };
}

export async function setDebtRecurringPausedAction(
  workspaceId: string,
  debtId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, workspaces } = getRepositories();
  const { setDebtRecurringPaused } = await import(
    "@/modules/debt/application/set-debt-reminders"
  );

  const result = await setDebtRecurringPaused(
    debtId,
    user.id,
    String(formData.get("paused") ?? "") === "1",
    debts,
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null, ok: true };
}

export async function setInstallmentReminderDisabledAction(
  workspaceId: string,
  debtId: string,
  installmentId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { installments, debts, workspaces } = getRepositories();
  const { setInstallmentReminderDisabled } = await import(
    "@/modules/installment/application/set-installment-reminder-disabled"
  );

  const result = await setInstallmentReminderDisabled(
    installmentId,
    user.id,
    String(formData.get("disabled") ?? "") === "1",
    installments,
    debts,
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null, ok: true };
}

export async function setDebtVisibilityAction(
  workspaceId: string,
  debtId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, workspaces } = getRepositories();
  const { setDebtVisibility } = await import("@/modules/debt/application/set-debt-visibility");

  const result = await setDebtVisibility(
    debtId,
    user.id,
    String(formData.get("hideMode") ?? "NONE"),
    formData.getAll("hiddenUserId").map((value) => String(value)).filter(Boolean),
    debts,
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null, ok: true };
}

export async function batchUpdateInstallmentsAction(
  workspaceId: string,
  debtId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, installments, workspaces } = getRepositories();
  const { batchUpdateInstallments } = await import(
    "@/modules/debt/application/batch-update-installments"
  );

  const ids = formData
    .getAll("installmentId")
    .map((value) => String(value))
    .filter(Boolean);

  const amountRaw = String(formData.get("amount") ?? "").trim();
  const dayRaw = String(formData.get("dueDay") ?? "").trim();

  let amountCents: number | undefined;
  let dueDay: number | undefined;

  try {
    if (amountRaw) {
      amountCents = parseBRLInput(amountRaw);
    }
    if (dayRaw) {
      dueDay = Number(dayRaw);
      if (!Number.isInteger(dueDay)) {
        throw new Error("invalid day");
      }
    }
  } catch {
    return { error: "Valor ou dia invalidos" };
  }

  const result = await batchUpdateInstallments(
    debtId,
    user.id,
    ids,
    { amountCents, dueDay },
    debts,
    installments,
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return {
    error: null,
    ok: true,
    message: `${result.value.updated} parcela(s) atualizada(s)`,
  };
}

export async function addInstallmentAction(
  workspaceId: string,
  debtId: string,
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, workspaces } = getRepositories();
  const { addDebtInstallment } = await import(
    "@/modules/installment/application/manage-debt-installments"
  );

  const result = await addDebtInstallment(debtId, user.id, debts, workspaces);
  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return { error: null, ok: true, installmentId: result.value.id };
}

export async function reorderInstallmentsAction(
  workspaceId: string,
  debtId: string,
  orderedIds: string[],
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, installments, workspaces } = getRepositories();
  const { reorderDebtInstallments } = await import(
    "@/modules/installment/application/manage-debt-installments"
  );

  const result = await reorderDebtInstallments(
    debtId,
    user.id,
    orderedIds,
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

export async function batchDeleteInstallmentsAction(
  workspaceId: string,
  debtId: string,
  installmentIds: string[],
): Promise<ActionState> {
  const user = await requireUser();
  const { debts, installments, workspaces, storage } = getRepositories();
  const { batchDeleteInstallments } = await import(
    "@/modules/installment/application/manage-debt-installments"
  );

  const result = await batchDeleteInstallments(
    debtId,
    user.id,
    installmentIds,
    debts,
    installments,
    workspaces,
    storage,
  );
  if (!result.ok) {
    return { error: result.error.message };
  }

  await revalidateDebtPaths(workspaceId, debtId);
  return {
    error: null,
    ok: true,
    message: `${result.value.deleted} parcela(s) excluída(s)`,
  };
}
