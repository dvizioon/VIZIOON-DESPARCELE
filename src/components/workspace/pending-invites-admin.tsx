"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelWorkspaceInviteAction } from "@/app/actions/workspace";
import { FormError } from "@/components/forms/auth-forms";
import { AppIcon } from "@/components/ui/icon";
import { roleLabel, type WorkspaceRole } from "@/modules/workspace/domain/workspace";

export type AdminPendingInvite = {
  id: string;
  email: string;
  role: WorkspaceRole;
  invitedByName: string;
};

export function PendingInvitesAdmin({ invites }: { invites: AdminPendingInvite[] }) {
  if (invites.length === 0) {
    return null;
  }

  return (
    <div className="sheet space-y-3" data-reveal>
      <div>
        <h3 className="font-display text-2xl">Convites pendentes</h3>
        <p className="mt-1 text-sm text-ink/55">
          Aguardando a pessoa aceitar em Espaços. Ainda não entram no workspace.
        </p>
      </div>
      <ul className="grid gap-2">
        {invites.map((invite) => (
          <PendingInviteAdminRow invite={invite} key={invite.id} />
        ))}
      </ul>
    </div>
  );
}

function PendingInviteAdminRow({ invite }: { invite: AdminPendingInvite }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setPending(true);
    setError(null);
    const result = await cancelWorkspaceInviteAction(invite.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl bg-paper px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate font-medium">
          <AppIcon className="size-4 shrink-0 text-pine" name="tabler:mail" />
          {invite.email}
        </p>
        <p className="text-xs text-ink/55">
          {roleLabel(invite.role)} · enviado por {invite.invitedByName}
        </p>
        {error ? <FormError message={error} /> : null}
      </div>
      <button className="btn-ghost shrink-0" disabled={pending} onClick={() => void cancel()} type="button">
        {pending ? "Cancelando..." : "Cancelar"}
      </button>
    </li>
  );
}
