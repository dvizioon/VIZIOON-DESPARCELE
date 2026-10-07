"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  resendEmailVerificationAction,
  type ActionState,
} from "@/app/actions/auth";
import { FormError } from "@/components/forms/auth-forms";
import { AppIcon } from "@/components/ui/icon";

const empty: ActionState = { error: null };

export function VerifyEmailBanner({
  email,
  graceHoursLeft,
}: {
  email: string;
  graceHoursLeft: number | null;
}) {
  const [state, action, pending] = useActionState(resendEmailVerificationAction, empty);

  return (
    <div
      className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
      data-reveal
      role="status"
    >
      <div className="min-w-0 space-y-1">
        <p className="flex items-start gap-2 font-medium">
          <AppIcon className="mt-0.5 size-4 shrink-0 text-amber-700" name="tabler:mail-exclamation" />
          Confirme sua conta
        </p>
        <p className="text-amber-900/75">
          Enviamos um link para <span className="font-medium">{email}</span>. Sem confirmar, o
          acesso fica limitado
          {graceHoursLeft != null && graceHoursLeft > 0
            ? ` — ainda restam cerca de ${graceHoursLeft}h`
            : ""}
          .
        </p>
        {state.error ? <FormError message={state.error} /> : null}
        {state.ok && !state.error ? (
          <p className="text-moss">{state.message ?? "E-mail enviado."}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <form action={action}>
          <button className="btn-secondary" disabled={pending} type="submit">
            {pending ? "Enviando..." : "Reenviar"}
          </button>
        </form>
        <Link className="btn-primary" href="/verificar-email">
          Confirmar
        </Link>
      </div>
    </div>
  );
}
