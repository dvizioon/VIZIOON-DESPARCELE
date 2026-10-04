"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteNoteAction } from "@/app/actions/note";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/ui/icon";
import { formatDateFull } from "@/shared/utils/date";

export type NoteListItem = {
  id: string;
  authorName: string;
  authorId: string;
  content: string;
  createdAt: string;
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
  }>;
};

export function NoteList({
  workspaceId,
  debtId,
  notes,
  currentUserId,
  canManage,
}: {
  workspaceId: string;
  debtId: string;
  notes: NoteListItem[];
  currentUserId: string;
  canManage: boolean;
}) {
  if (notes.length === 0) {
    return (
      <p className="flex items-center gap-2 text-ink/55">
        <AppIcon name="tabler:notes-off" className="size-5" />
        Nenhuma nota ainda
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {notes.map((note) => (
        <li className="rounded-2xl bg-white/80 p-4" key={note.id}>
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="text-sm text-ink/55">
              {note.authorName} · {formatDateFull(new Date(note.createdAt))}
            </p>
            {note.authorId === currentUserId || canManage ? (
              <DeleteNoteButton debtId={debtId} noteId={note.id} workspaceId={workspaceId} />
            ) : null}
          </div>
          <div
            className="prose-note text-ink"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
          {note.attachments.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {note.attachments.map((file) => (
                <Link
                  className="btn-ghost !px-3 !py-1.5 text-xs"
                  href={file.url}
                  key={file.id}
                  target="_blank"
                >
                  <AppIcon name="tabler:file-invoice" className="size-4" />
                  {file.filename}
                </Link>
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function DeleteNoteButton({
  workspaceId,
  debtId,
  noteId,
}: {
  workspaceId: string;
  debtId: string;
  noteId: string;
}) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="rounded-full p-1.5 text-ink/40 transition hover:bg-white hover:text-clay"
        disabled={pending}
        onClick={() => setOpen(true)}
        type="button"
      >
        <AppIcon name="tabler:trash" className="size-4" />
        <span className="sr-only">Remover nota</span>
      </button>
      <ConfirmDialog
        confirmLabel="Excluir nota"
        danger
        description="A nota e os comprovantes dela somem. Confirme se era isso."
        open={open}
        pending={pending}
        title="Excluir esta nota?"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setPending(true);
          void deleteNoteAction(workspaceId, debtId, noteId).finally(() => {
            setPending(false);
            setOpen(false);
          });
        }}
      />
    </>
  );
}
