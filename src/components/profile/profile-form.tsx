"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import {
  closeAccountAction,
  requestProfilePasswordResetAction,
  updateProfileAction,
  type ActionState,
} from "@/app/actions/auth";
import { FormError } from "@/components/forms/auth-forms";
import { AvatarPickerModal } from "@/components/profile/avatar-picker-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/ui/icon";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatPhoneDisplay, type AvatarVariant } from "@/modules/auth/domain/user";

const empty: ActionState = { error: null };

export function ProfileForm({
  name,
  email,
  phone,
  avatarUrl,
  avatarVariant,
}: {
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  avatarVariant: AvatarVariant;
}) {
  const router = useRouter();
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, empty);
  const [passwordState, passwordAction, passwordPending] = useActionState(
    requestProfilePasswordResetAction,
    empty,
  );
  const [closePending, setClosePending] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  async function confirmCloseAccount() {
    setClosePending(true);
    setCloseError(null);
    const result = await closeAccountAction();
    setClosePending(false);
    if (result.error) {
      setCloseError(result.error);
      setConfirmClose(false);
    }
  }

  const displayPhone = formatPhoneDisplay(phone);

  return (
    <div className="space-y-5">
      <section className="sheet space-y-4" data-reveal>
        <div className="flex flex-wrap items-center gap-4">
          <button
            aria-label="Alterar avatar"
            className="group relative shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
            onClick={() => setAvatarOpen(true)}
            type="button"
          >
            <UserAvatar avatarUrl={avatarUrl} name={name} size={72} variant={avatarVariant} />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/45 opacity-0 transition group-hover:opacity-100">
              <AppIcon className="size-5 text-white" name="tabler:camera" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl">{name}</p>
            <p className="text-sm text-ink/55">{email}</p>
            <p className="mt-1 text-xs text-ink/45">Toque no avatar para mudar.</p>
          </div>
        </div>
      </section>

      <section className="sheet space-y-3" data-reveal>
        <h2 className="font-display text-2xl">Dados</h2>
        <form action={profileAction} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm text-ink/60">Nome completo</span>
            <input className="field w-full" defaultValue={name} name="name" required />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-ink/60">E-mail</span>
            <input className="field w-full bg-paper/70" disabled readOnly value={email} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-ink/60">Telefone</span>
            <input
              className="field w-full"
              defaultValue={displayPhone}
              inputMode="tel"
              name="phone"
              placeholder="(11) 99999-9999"
            />
          </label>
          {profileState.error ? <FormError message={profileState.error} /> : null}
          {profileState.ok && !profileState.error ? (
            <p className="text-sm text-moss">{profileState.message ?? "Perfil salvo."}</p>
          ) : null}
          <button className="btn-primary" disabled={profilePending} type="submit">
            {profilePending ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </section>

      <section className="sheet space-y-3" data-reveal>
        <h2 className="font-display text-2xl">Senha</h2>
        <p className="text-sm text-ink/60">Enviamos um e-mail com o link para redefinir a senha.</p>
        <form action={passwordAction}>
          <button
            className="btn-ghost inline-flex items-center gap-2"
            disabled={passwordPending}
            type="submit"
          >
            <AppIcon className="size-4" name="tabler:mail" />
            {passwordPending ? "Enviando..." : "Enviar e-mail para mudar senha"}
          </button>
        </form>
        {passwordState.error ? <FormError message={passwordState.error} /> : null}
        {passwordState.ok && !passwordState.error ? (
          <p className="text-sm text-moss">
            {passwordState.message ?? "Se o e-mail estiver certo, o link já foi pra caixa de entrada."}
          </p>
        ) : null}
      </section>

      <section className="sheet space-y-3 border border-clay/25" data-reveal>
        <h2 className="font-display text-2xl text-clay">Encerrar conta</h2>
        <p className="text-sm text-ink/60">
          Desativa sua conta e você sai do app. Depois disso não dá para entrar com este e-mail até um
          admin reativar.
        </p>
        {closeError ? <FormError message={closeError} /> : null}
        <button
          className="btn-ghost text-clay"
          onClick={() => setConfirmClose(true)}
          type="button"
        >
          Encerrar minha conta
        </button>
      </section>

      <AvatarPickerModal
        avatarUrl={avatarUrl}
        name={name}
        open={avatarOpen}
        variant={avatarVariant}
        onClose={() => setAvatarOpen(false)}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        confirmLabel="Encerrar conta"
        danger
        description="Sua conta será desativada e você será desconectado agora."
        open={confirmClose}
        pending={closePending}
        title="Encerrar conta?"
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => void confirmCloseAccount()}
      />
    </div>
  );
}
