"use client";

import { useState } from "react";
import { removeMemberAction } from "@/app/actions/workspace";
import { FormError } from "@/components/forms/auth-forms";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/ui/icon";

export function RemoveMemberButton({
  workspaceId,
  userId,
  userName,
}: {
  workspaceId: string;
  userId: string;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="w-full sm:w-52">
      <button
        className="field flex min-h-12 items-center justify-center gap-2 text-clay sm:min-h-0"
        onClick={() => setOpen(true)}
        type="button"
      >
        <AppIcon name="tabler:user-minus" className="size-4" />
        Remover
      </button>
      {error ? <div className="mt-2"><FormError message={error} /></div> : null}
      <ConfirmDialog
        confirmLabel="Remover"
        danger
        description={`${userName} perde o acesso a este espaço. As dívidas e os pagamentos continuam no lugar.`}
        open={open}
        pending={pending}
        title={`Tirar ${userName} do espaço?`}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setPending(true);
          void removeMemberAction(workspaceId, userId).then((result) => {
            setPending(false);
            setOpen(false);
            if (result.error) {
              setError(result.error);
            }
          });
        }}
      />
    </div>
  );
}
