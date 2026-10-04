"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setInstallmentAmountAction } from "@/app/actions/debt";
import { FormError } from "@/components/forms/auth-forms";

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function InstallmentAmountEditor({
  workspaceId,
  debtId,
  installmentId,
  amountCents,
}: {
  workspaceId: string;
  debtId: string;
  installmentId: string;
  amountCents: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(centsToInput(amountCents));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const dirty = value.trim() !== centsToInput(amountCents);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await setInstallmentAmountAction(
          workspaceId,
          debtId,
          installmentId,
          formData,
        );
        setPending(false);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.refresh();
      }}
      className="flex flex-col items-end gap-2"
    >
      <label className="flex items-center gap-2">
        <span className="text-sm text-ink/50">R$</span>
        <input
          className="field w-32 text-right font-display text-xl"
          name="amount"
          onChange={(event) => setValue(event.target.value)}
          value={value}
        />
      </label>
      {dirty ? (
        <button className="btn-ghost text-xs" disabled={pending} type="submit">
          {pending ? "Salvando..." : "Salvar valor"}
        </button>
      ) : null}
      {error ? <FormError message={error} /> : null}
    </form>
  );
}
