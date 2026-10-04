"use client";

import { useState } from "react";
import { archiveWorkspaceAction, unarchiveWorkspaceAction } from "@/app/actions/workspace";
import { FormError } from "@/components/forms/auth-forms";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/ui/icon";

export function ArchiveWorkspaceButton({
  workspaceId,
  workspaceName,
  archived,
  wide = false,
}: {
  workspaceId: string;
  workspaceName: string;
  archived: boolean;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const buttonClass = wide ? "btn-ghost w-full" : "btn-ghost";

  if (archived) {
    return (
      <div className="space-y-2">
        <button
          className={buttonClass}
          disabled={pending}
          onClick={() => {
            setPending(true);
            setError(null);
            void unarchiveWorkspaceAction(workspaceId).then((result) => {
              setPending(false);
              if (result.error) {
                setError(result.error);
              }
            });
          }}
          type="button"
        >
          <AppIcon name="tabler:archive-off" className="size-4" />
          {pending ? "Restaurando..." : "Restaurar espaço"}
        </button>
        {error ? <FormError message={error} /> : null}
      </div>
    );
  }

  return (
    <>
      <button className={buttonClass} onClick={() => setOpen(true)} type="button">
        <AppIcon name="tabler:archive" className="size-4" />
        Arquivar espaço
      </button>
      {error ? <FormError message={error} /> : null}
      <ConfirmDialog
        confirmLabel="Arquivar"
        description={`${workspaceName} some da lista principal. Dívidas ficam guardadas e dá para restaurar depois.`}
        open={open}
        pending={pending}
        title={`Arquivar ${workspaceName}?`}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setPending(true);
          void archiveWorkspaceAction(workspaceId).then((result) => {
            if (result.error) {
              setPending(false);
              setError(result.error);
              setOpen(false);
            }
          });
        }}
      />
    </>
  );
}
