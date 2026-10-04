import { debtHiddenMessage } from "@/modules/debt/application/require-visible-debt";
import type { DebtRepository } from "@/modules/debt/domain/debt-repository";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { isReceiptMimeType, type FileStorage } from "@/shared/storage/file-storage";
import { fail, ok, type Result } from "@/shared/types/result";
import { isEmptyHtml, sanitizeNoteHtml } from "@/shared/utils/html";
import type { DebtNote } from "../domain/note";
import type { NoteRepository } from "../domain/note-repository";

export interface NoteFileInput {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export async function createDebtNote(
  debtId: string,
  actorId: string,
  html: string,
  files: NoteFileInput[],
  notes: NoteRepository,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
  storage: FileStorage,
): Promise<Result<DebtNote>> {
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

  const content = sanitizeNoteHtml(html);
  if (isEmptyHtml(content) && files.length === 0) {
    return fail("EMPTY_NOTE", "Escreva a nota ou anexe um comprovante");
  }

  const attachments = [];
  for (const file of files) {
    if (!isReceiptMimeType(file.mimeType)) {
      return fail("INVALID_FILE", "Envie imagem ou PDF");
    }

    if (file.buffer.byteLength > 5 * 1024 * 1024) {
      return fail("FILE_TOO_LARGE", "Arquivo no maximo 5 MB");
    }

    const url = await storage.save(file, "notes");
    attachments.push({
      url,
      filename: file.filename,
      mimeType: file.mimeType,
    });
  }

  const note = await notes.create({
    debtId,
    authorId: actorId,
    content,
    attachments,
  });

  return ok(note);
}
