"use server";

import { revalidatePath } from "next/cache";
import { createDebtNote } from "@/modules/note/application/create-note";
import { deleteDebtNote } from "@/modules/note/application/delete-note";
import { requireUser } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";
import type { ActionState } from "./auth";

export async function createNoteAction(
  workspaceId: string,
  debtId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { notes, debts, workspaces, storage } = getRepositories();
  const files = formData
    .getAll("attachments")
    .filter((item): item is File => item instanceof File && item.size > 0);

  const result = await createDebtNote(
    debtId,
    user.id,
    String(formData.get("content") ?? ""),
    await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        filename: file.name,
        mimeType: file.type,
      })),
    ),
    notes,
    debts,
    workspaces,
    storage,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath(`/w/${workspaceId}/debts/${debtId}`);
  return { error: null };
}

export async function deleteNoteAction(
  workspaceId: string,
  debtId: string,
  noteId: string,
): Promise<ActionState> {
  const user = await requireUser();
  const { notes, debts, workspaces, storage } = getRepositories();
  const result = await deleteDebtNote(noteId, user.id, notes, debts, workspaces, storage);

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath(`/w/${workspaceId}/debts/${debtId}`);
  return { error: null };
}
