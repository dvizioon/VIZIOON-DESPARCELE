import { debtHiddenMessage } from "@/modules/debt/application/require-visible-debt";
import type { DebtRepository } from "@/modules/debt/domain/debt-repository";
import type { FileStorage } from "@/shared/storage/file-storage";
import { isReceiptMimeType } from "@/shared/storage/file-storage";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { Installment } from "../domain/installment";
import type { InstallmentRepository } from "../domain/installment-repository";

export interface ReceiptFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface MarkInstallmentPaidCommand {
  installmentId: string;
  actorId: string;
  paidByUserId?: string | null;
  receipt: ReceiptFile | null;
}

export async function markInstallmentPaid(
  command: MarkInstallmentPaidCommand,
  installments: InstallmentRepository,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
  storage: FileStorage,
): Promise<Result<Installment>> {
  const installment = await installments.findById(command.installmentId);
  if (!installment) {
    return fail("NOT_FOUND", "Parcela nao encontrada");
  }

  if (installment.status === "PAID") {
    return fail("ALREADY_PAID", "Essa parcela ja foi paga");
  }

  const debt = await debts.findById(installment.debtId);
  if (!debt) {
    return fail("NOT_FOUND", "Divida nao encontrada");
  }

  const member = await workspaces.findMember(debt.workspaceId, command.actorId);
  if (!member || !canEditContent(member)) {
    return fail("FORBIDDEN", "Seu papel so permite visualizar");
  }

  const hidden = debtHiddenMessage(debt, command.actorId, member);
  if (hidden) {
    return fail("NOT_FOUND", hidden);
  }

  const paidByUserId = command.paidByUserId?.trim() || command.actorId;
  const payer = await workspaces.findMember(debt.workspaceId, paidByUserId);
  if (!payer) {
    return fail("INVALID_PAYER", "Escolha alguem deste espaco");
  }

  let receiptUrl: string | null = null;
  if (command.receipt) {
    if (!isReceiptMimeType(command.receipt.mimeType)) {
      return fail("INVALID_FILE", "Envie uma imagem ou PDF");
    }

    if (command.receipt.buffer.byteLength > 5 * 1024 * 1024) {
      return fail("FILE_TOO_LARGE", "Arquivo no maximo 5 MB");
    }

    receiptUrl = await storage.save(command.receipt, "receipts");
  }

  const paid = await installments.markPaid({
    installmentId: command.installmentId,
    paidByUserId,
    receiptUrl,
  });

  return ok(paid);
}
