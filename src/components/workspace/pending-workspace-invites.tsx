"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  acceptWorkspaceInviteAction,
  declineWorkspaceInviteAction,
} from "@/app/actions/workspace";
import { FormError } from "@/components/forms/auth-forms";
import { FancyCheckbox } from "@/components/ui/fancy-checkbox";
import { AppIcon } from "@/components/ui/icon";
import { roleLabel, type WorkspaceRole } from "@/modules/workspace/domain/workspace";

export type PendingInviteCard = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
  invitedByName: string;
};

export function PendingWorkspaceInvites({ invites }: { invites: PendingInviteCard[] }) {
  if (invites.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" data-reveal>
      <div>
        <p className="font-display text-2xl">Convites</p>
        <p className="mt-1 text-sm text-ink/60">
          Marque que concorda e entre no espaço. Ninguém te coloca direto — você aceita.
        </p>
      </div>
      <ul className="grid gap-3">
        {invites.map((invite) => (
          <PendingInviteRow invite={invite} key={invite.id} />
        ))}
      </ul>
    </section>
  );
}

function PendingInviteRow({ invite }: { invite: PendingInviteCard }) {
  const router = useRouter();
  const [ack, setAck] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setPending(true);
    setError(null);
    const result = await acceptWorkspaceInviteAction(invite.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(`/w/${invite.workspaceId}`);
    router.refresh();
  }

  async function decline() {
    setPending(true);
    setError(null);
    const result = await declineWorkspaceInviteAction(invite.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <li className="sheet space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-display text-2xl">
            <AppIcon className="size-5 text-pine" name="tabler:mail-opened" />
            {invite.workspaceName}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {invite.invitedByName} convidou você como {roleLabel(invite.role)}.
          </p>
        </div>
      </div>

      <FancyCheckbox
        checked={ack}
        className="w-full"
        disabled={pending}
        label="Quero entrar neste espaço"
        tip="Só depois de marcar o botão de aceitar libera. Você escolhe entrar."
        onChange={setAck}
      />

      {error ? <FormError message={error} /> : null}

      <div className="flex flex-wrap gap-2">
        <button
          className="btn-primary disabled:opacity-40"
          disabled={!ack || pending}
          onClick={() => void accept()}
          type="button"
        >
          {pending ? "Entrando..." : "Aceitar convite"}
        </button>
        <button className="btn-ghost" disabled={pending} onClick={() => void decline()} type="button">
          Recusar
        </button>
      </div>
    </li>
  );
}
