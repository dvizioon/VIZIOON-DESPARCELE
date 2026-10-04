"use client";

import { useMemo, useState } from "react";
import { permanentlyDeleteWorkspacesAction } from "@/app/actions/workspace";
import { FormError } from "@/components/forms/auth-forms";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/ui/icon";
import { RestoreWorkspaceButton } from "@/components/workspace/restore-workspace-button";
import { roleLabel, type WorkspaceRole, type WorkspaceType } from "@/modules/workspace/domain/workspace";

export type TrashWorkspaceItem = {
  id: string;
  name: string;
  type: WorkspaceType;
  role: WorkspaceRole;
  memberCount: number;
  canManage: boolean;
};

export function WorkspaceTrashList({ items }: { items: TrashWorkspaceItem[] }) {
  const manageableIds = useMemo(
    () => items.filter((item) => item.canManage).map((item) => item.id),
    [items],
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selectedIds = selected.filter((id) => manageableIds.includes(id));
  const allSelected = manageableIds.length > 0 && selectedIds.length === manageableIds.length;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : manageableIds);
  }

  return (
    <div className="space-y-4">
      {manageableIds.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3" data-reveal>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink/70">
            <input checked={allSelected} className="peer sr-only" onChange={toggleAll} type="checkbox" />
            <span className="flex size-5 items-center justify-center rounded-md border border-line bg-white peer-checked:border-pine peer-checked:bg-pine peer-checked:text-white">
              {allSelected ? <AppIcon name="tabler:check" className="size-3.5" /> : null}
            </span>
            Selecionar todos
          </label>
          <button
            className="btn-ghost text-clay"
            disabled={selectedIds.length === 0}
            onClick={() => setOpen(true)}
            type="button"
          >
            <AppIcon name="tabler:trash-x" className="size-4" />
            Apagar de vez
            {selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
          </button>
        </div>
      ) : null}

      {error ? <FormError message={error} /> : null}

      <ul className="grid gap-3">
        {items.map((workspace) => {
          const checked = selectedIds.includes(workspace.id);

          return (
            <li className="sheet flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-reveal key={workspace.id}>
              <div className="flex min-w-0 items-start gap-3">
                {workspace.canManage ? (
                  <label className="mt-1 inline-flex cursor-pointer">
                    <input
                      checked={checked}
                      className="peer sr-only"
                      onChange={() => toggle(workspace.id)}
                      type="checkbox"
                    />
                    <span className="flex size-5 items-center justify-center rounded-md border border-line bg-white peer-checked:border-pine peer-checked:bg-pine peer-checked:text-white">
                      {checked ? <AppIcon name="tabler:check" className="size-3.5" /> : null}
                    </span>
                    <span className="sr-only">Selecionar {workspace.name}</span>
                  </label>
                ) : null}
                <div className="min-w-0">
                  <p className="font-display text-2xl">{workspace.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/60">
                    <AppIcon
                      name={workspace.type === "SHARED" ? "tabler:users" : "tabler:user"}
                      className="size-4"
                    />
                    {workspace.type === "SHARED" ? "Compartilhado" : "Pessoal"}
                    <span className="text-ink/35">·</span>
                    {roleLabel(workspace.role)}
                    <span className="text-ink/35">·</span>
                    {workspace.memberCount} {workspace.memberCount === 1 ? "pessoa" : "pessoas"}
                  </p>
                </div>
              </div>
              {workspace.canManage ? <RestoreWorkspaceButton workspaceId={workspace.id} /> : null}
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        confirmLabel="Apagar de vez"
        danger
        description="Dívidas, parcelas e notas somem junto. Não dá para desfazer."
        open={open}
        pending={pending}
        title={
          selectedIds.length === 1
            ? "Apagar este espaço de vez?"
            : `Apagar ${selectedIds.length} espaços de vez?`
        }
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setPending(true);
          void permanentlyDeleteWorkspacesAction(selectedIds).then((result) => {
            setPending(false);
            setOpen(false);
            if (result.error) {
              setError(result.error);
              return;
            }
            setSelected([]);
          });
        }}
      />
    </div>
  );
}
