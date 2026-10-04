"use client";

import { useState } from "react";
import { changeMemberRoleAction } from "@/app/actions/workspace";
import { FormError } from "@/components/forms/auth-forms";
import { SearchSelect } from "@/components/ui/search-select";
import type { WorkspaceRole } from "@/modules/workspace/domain/workspace";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "EDITOR", label: "Editor" },
  { value: "VIEWER", label: "Visualizador" },
];

export function MemberRoleForm({
  workspaceId,
  userId,
  role,
  locked,
}: {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  locked: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [current, setCurrent] = useState<WorkspaceRole>(role);

  if (locked) {
    return (
      <span className="field flex min-h-12 w-full items-center justify-center text-sm text-ink/65 sm:min-h-0 sm:w-52">
        Administrador
      </span>
    );
  }

  return (
    <div className="w-full sm:w-52">
      <SearchSelect
        disabled={pending}
        options={ROLE_OPTIONS}
        searchPlaceholder="Buscar papel"
        value={current}
        onChange={(value) => {
          const next = value as WorkspaceRole;
          setCurrent(next);
          setPending(true);
          setError(null);
          const data = new FormData();
          data.set("role", next);
          void changeMemberRoleAction(workspaceId, userId, data).then((result) => {
            setPending(false);
            if (result.error) {
              setError(result.error);
              setCurrent(role);
            }
          });
        }}
      />
      {error ? <FormError message={error} /> : null}
    </div>
  );
}
