"use client";

import { useActionState, useState } from "react";
import { inviteMemberAction } from "@/app/actions/workspace";
import type { ActionState } from "@/app/actions/auth";
import { FormError } from "@/components/forms/auth-forms";
import { SearchSelect } from "@/components/ui/search-select";

const initial: ActionState = { error: null };

export function InviteForm({ workspaceId }: { workspaceId: string }) {
  const action = inviteMemberAction.bind(null, workspaceId);
  const [state, formAction, pending] = useActionState(action, initial);
  const [role, setRole] = useState("EDITOR");

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-xs text-ink/55">
        A pessoa recebe o e-mail e precisa aceitar o convite em Espaços. Ninguém entra no workspace
        sem aceitar.
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <input
          className="field min-w-0"
          name="email"
          placeholder="e-mail da pessoa"
          required
          type="email"
        />
        <SearchSelect
          name="role"
          options={[
            { value: "EDITOR", label: "Editor" },
            { value: "VIEWER", label: "Visualizador" },
            { value: "ADMIN", label: "Administrador" },
          ]}
          searchPlaceholder="Buscar papel"
          value={role}
          onChange={setRole}
        />
        <button className="btn-primary w-full sm:w-auto" disabled={pending} type="submit">
          {pending ? "Convidando..." : "Convidar"}
        </button>
      </div>
      {state.error ? <FormError message={state.error} /> : null}
      {state.ok && !state.error ? (
        <p className="text-sm text-moss">{state.message ?? "Convite enviado."}</p>
      ) : null}
    </form>
  );
}
