"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setAllowPublicSignupAction } from "@/app/actions/admin";
import { FormError } from "@/components/forms/auth-forms";

export function SignupSettingsForm({ allowPublicSignup }: { allowPublicSignup: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(allowPublicSignup);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setError(null);
    setEnabled(next);
    startTransition(async () => {
      const result = await setAllowPublicSignupAction(next);
      if (result.error) {
        setEnabled(!next);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="sheet space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl">Novas contas</h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                enabled ? "bg-pine-soft text-pine-dark" : "bg-clay/10 text-clay"
              }`}
            >
              {enabled ? "Permitido" : "Bloqueado"}
            </span>
          </div>
          <p className="mt-2 max-w-md text-sm text-ink/60">
            {enabled
              ? "Qualquer pessoa pode criar uma conta."
              : "Só quem já tem conta consegue entrar."}
          </p>
        </div>

        <button
          aria-pressed={enabled}
          className={`relative h-9 w-16 shrink-0 rounded-full transition ${
            enabled ? "bg-pine" : "bg-ink/20"
          } ${pending ? "opacity-60" : ""}`}
          disabled={pending}
          onClick={() => toggle(!enabled)}
          type="button"
        >
          <span
            className={`absolute top-1 size-7 rounded-full bg-white shadow transition ${
              enabled ? "left-8" : "left-1"
            }`}
          />
          <span className="sr-only">{enabled ? "Bloquear novas contas" : "Permitir novas contas"}</span>
        </button>
      </div>

      {error ? <FormError message={error} /> : null}
    </div>
  );
}
