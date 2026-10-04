"use client";

import { useState } from "react";
import { restoreWorkspaceAction } from "@/app/actions/workspace";
import { FormError } from "@/components/forms/auth-forms";
import { AppIcon } from "@/components/ui/icon";

export function RestoreWorkspaceButton({
  workspaceId,
  className = "btn-ghost",
}: {
  workspaceId: string;
  className?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-2">
      <button
        className={className}
        disabled={pending}
        onClick={() => {
          setPending(true);
          setError(null);
          void restoreWorkspaceAction(workspaceId).then((result) => {
            setPending(false);
            if (result.error) {
              setError(result.error);
            }
          });
        }}
        type="button"
      >
        <AppIcon name="tabler:arrow-back-up" className="size-4" />
        {pending ? "Restaurando..." : "Restaurar"}
      </button>
      {error ? <FormError message={error} /> : null}
    </div>
  );
}
