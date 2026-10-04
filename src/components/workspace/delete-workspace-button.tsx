"use client";

import { useState } from "react";
import { trashWorkspaceAction } from "@/app/actions/workspace";
import { FormError } from "@/components/forms/auth-forms";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/ui/icon";

export function DeleteWorkspaceButton({
  workspaceId,
  workspaceName,
  className = "btn-ghost text-clay",
}: {
  workspaceId: string;
  workspaceName: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <>
      <button className={className} onClick={() => setOpen(true)} type="button">
        <AppIcon name="tabler:trash" className="size-4" />
        Mover para a lixeira
      </button>
      {error ? <FormError message={error} /> : null}
      <ConfirmDialog
        confirmLabel="Mover para a lixeira"
        danger
        description={`${workspaceName} some de Todos e Arquivados. Dá para restaurar ou apagar de vez na lixeira.`}
        open={open}
        pending={pending}
        title={`Mover ${workspaceName} para a lixeira?`}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setPending(true);
          void trashWorkspaceAction(workspaceId).then((result) => {
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
