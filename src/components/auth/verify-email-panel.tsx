"use client";

import { useActionState } from "react";
import {
  resendEmailVerificationAction,
  type ActionState,
} from "@/app/actions/auth";
import { FormError } from "@/components/forms/auth-forms";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { AppIcon } from "@/components/ui/icon";

const empty: ActionState = { error: null };

export function VerifyEmailPanel({
  email,
  locked,
  graceHoursLeft,
  tokenError,
  verified,
}: {
  email: string;
  locked: boolean;
  graceHoursLeft: number | null;
  tokenError: string | null;
  verified: boolean;
}) {
  const [state, action, pending] = useActionState(resendEmailVerificationAction, empty);

  if (verified) {
    return (
      <div className="sheet space-y-4">
        <div className="flex items-center gap-2 text-moss">
          <AppIcon className="size-5" name="tabler:circle-check" />
          <p className="font-medium">E-mail confirmado</p>
        </div>
        <p className="text-sm text-ink/60">Pode seguir usando o Desparcele normalmente.</p>
        <a className="btn-primary inline-flex" href="/workspaces">
          Ir para os espaços
        </a>
      </div>
    );
  }

  return (
    <div className="sheet space-y-4">
      <div>
        <h1 className="font-display text-3xl">Verifique seu e-mail</h1>
        <p className="mt-2 text-sm text-ink/60">
          Enviamos um link para <strong>{email}</strong>.
        </p>
      </div>

      {locked ? (
        <p className="rounded-2xl bg-clay/10 px-3 py-2 text-sm text-clay">
          Passaram 24 horas sem confirmação. Para continuar, abra o e-mail e confirme — ou peça um
          novo link abaixo.
        </p>
      ) : graceHoursLeft != null ? (
        <p className="rounded-2xl bg-pine-soft/60 px-3 py-2 text-sm text-pine-dark">
          Você ainda pode usar o app por cerca de {graceHoursLeft}h. Depois disso, só entra depois de
          verificar.
        </p>
      ) : null}

      {tokenError ? <FormError message={tokenError} /> : null}
      {state.error ? <FormError message={state.error} /> : null}
      {state.ok && !state.error ? (
        <p className="text-sm text-moss">{state.message ?? "E-mail enviado."}</p>
      ) : null}

      <form action={action}>
        <button className="btn-primary w-full" disabled={pending} type="submit">
          {pending ? "Enviando..." : "Reenviar e-mail"}
        </button>
      </form>

      <div className="flex justify-center">
        <SignOutButton />
      </div>
    </div>
  );
}
