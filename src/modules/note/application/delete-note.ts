import type { DebtRepository } from "@/modules/debt/domain/debt-repository";
import { isAdmin } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import type { FileStorage } from "@/shared/storage/file-storage";
import { fail, ok, type Result } from "@/shared/types/result";
import type { NoteRepository } from "../domain/note-repository";

export async function deleteDebtNote(
  noteId: string,
  actorId: string,
  notes: NoteRepository,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
  storage: FileStorage,
): Promise<Result<{ id: string }>> {
  const note = await notes.findById(noteId);
  if (!note) {
    return fail("NOT_FOUND", "Nota nao encontrada");
  }

  const debt = await debts.findById(note.debtId);
  if (!debt) {
    return fail("NOT_FOUND", "Divida nao encontrada");
  }

  const member = await workspaces.findMember(debt.workspaceId, actorId);
  if (!member) {
    return fail("FORBIDDEN", "Voce nao faz parte deste espaco");
  }

  if (note.authorId !== actorId && !isAdmin(member)) {
    return fail("FORBIDDEN", "So quem escreveu ou o admin remove a nota");
  }

  for (const file of note.attachments) {
    await storage.remove(file.url);
  }

  await notes.deleteById(noteId);
  return ok({ id: noteId });
}
