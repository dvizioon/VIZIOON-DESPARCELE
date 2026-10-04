"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setAllowPublicSignupAction } from "@/app/actions/admin";
import { AppIcon } from "@/components/ui/icon";
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
    <div className="sheet space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl">Auto-cadastro</h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                enabled ? "bg-pine-soft text-pine-dark" : "bg-clay/10 text-clay"
              }`}
            >
              {enabled ? "Aberto" : "Fechado"}
            </span>
          </div>
          <p className="mt-2 max-w-lg text-sm text-ink/60">
            Quando aberto, qualquer pessoa cria conta em{" "}
            <span className="font-medium text-ink/80">/register</span>. Quando fechado, só entram
            contas que já existem — o link “Criar conta” some do login.
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
          <span className="sr-only">{enabled ? "Desativar auto-cadastro" : "Ativar auto-cadastro"}</span>
        </button>
      </div>

      <ul className="grid gap-2 text-sm text-ink/65">
        <li className="flex items-start gap-2">
          <AppIcon
            name={enabled ? "tabler:user-plus" : "tabler:user-off"}
            className="mt-0.5 size-4 shrink-0 text-pine"
          />
          {enabled
            ? "Novos usuários entram sozinhos e já podem criar espaços."
            : "Ninguém se cadastra sozinho. Contas novas só se o admin criar depois (ou reabrir o cadastro)."}
        </li>
        <li className="flex items-start gap-2">
          <AppIcon name="tabler:shield-check" className="mt-0.5 size-4 shrink-0 text-pine" />
          A conta admin (seed) e as já existentes continuam entrando normalmente.
        </li>
      </ul>

      {error ? <FormError message={error} /> : null}
    </div>
  );
}
