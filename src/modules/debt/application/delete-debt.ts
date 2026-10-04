import type { NoteRepository } from "@/modules/note/domain/note-repository";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import type { FileStorage } from "@/shared/storage/file-storage";
import { fail, ok, type Result } from "@/shared/types/result";
import type { DebtRepository } from "../domain/debt-repository";
import { debtHiddenMessage } from "./require-visible-debt";

export async function deleteDebt(
  debtId: string,
  actorId: string,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
  notes: NoteRepository,
  storage: FileStorage,
): Promise<Result<{ id: string }>> {
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

  const debtNotes = await notes.listByDebt(debtId);
  for (const note of debtNotes) {
    for (const file of note.attachments) {
      await storage.remove(file.url);
    }
  }

  for (const installment of debt.installments) {
    if (installment.receiptUrl) {
      await storage.remove(installment.receiptUrl);
    }
  }

  await debts.deleteById(debtId);
  return ok({ id: debtId });
}
