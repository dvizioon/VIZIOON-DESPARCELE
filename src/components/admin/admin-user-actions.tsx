"use client";

import { useActionState, useEffect, useState } from "react";
import {
  setUserDisabledAction,
  setUserPasswordAction,
  setUserRoleAction,
} from "@/app/actions/admin";
import { PasswordField } from "@/components/auth/password-field";
import { FormError } from "@/components/forms/auth-forms";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/ui/icon";
import { Portal } from "@/components/ui/portal";
import { type SystemRole } from "@/modules/auth/domain/user";

const empty = { error: null as string | null, ok: false as boolean | undefined };

export function AdminUserActions({
  userId,
  name,
  role,
  disabled,
  isMaster,
  isSelf,
}: {
  userId: string;
  name: string;
  role: SystemRole;
  disabled: boolean;
  isMaster: boolean;
  isSelf: boolean;
}) {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [confirm, setConfirm] = useState<"disable" | "enable" | "role" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextRole = role === "ADMIN" ? "USER" : "ADMIN";

  async function run(
    action: (formData: FormData) => Promise<{ error: string | null }>,
    values: Record<string, string>,
  ) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => formData.set(key, value));
    setPending(true);
    setError(null);
    const result = await action(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setConfirm(null);
  }

  return (
    <div className="space-y-2">
      {error ? <FormError message={error} /> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <button className="btn-ghost" onClick={() => setPasswordOpen(true)} type="button">
          <AppIcon name="tabler:key" className="size-4" />
          Senha
        </button>
        {isMaster ? null : (
          <button
            className="btn-ghost"
            disabled={isSelf && role === "ADMIN"}
            onClick={() => setConfirm("role")}
            type="button"
          >
            Tornar {nextRole === "ADMIN" ? "Admin" : "User"}
          </button>
        )}
        {isMaster || isSelf ? null : (
          <button
            className={disabled ? "btn-ghost" : "btn-ghost text-clay"}
            onClick={() => setConfirm(disabled ? "enable" : "disable")}
            type="button"
          >
            {disabled ? "Ativar" : "Desativar"}
          </button>
        )}
      </div>

      {passwordOpen ? (
        <PasswordDialog name={name} onClose={() => setPasswordOpen(false)} userId={userId} />
      ) : null}

      <ConfirmDialog
        confirmLabel={
          confirm === "disable"
            ? "Desativar"
            : confirm === "enable"
              ? "Ativar"
              : `Tornar ${nextRole === "ADMIN" ? "Admin" : "User"}`
        }
        danger={confirm === "disable"}
        description={
          confirm === "disable"
            ? `${name} perde o acesso ao app até alguém ativar de novo.`
            : confirm === "enable"
              ? `${name} volta a entrar com o e-mail e a senha.`
              : `${name} passa a ser ${nextRole === "ADMIN" ? "Admin" : "User"} na plataforma.`
        }
        open={confirm !== null}
        pending={pending}
        title={
          confirm === "disable" ? "Desativar conta" : confirm === "enable" ? "Ativar conta" : "Trocar papel"
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === "role") {
            void run(setUserRoleAction, { userId, role: nextRole });
            return;
          }
          void run(setUserDisabledAction, {
            userId,
            disabled: confirm === "disable" ? "1" : "0",
          });
        }}
      />
    </div>
  );
}

function PasswordDialog({
  userId,
  name,
  onClose,
}: {
  userId: string;
  name: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(setUserPasswordAction, empty);

  useEffect(() => {
    if (state.ok) {
      onClose();
    }
  }, [onClose, state.ok]);

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
        <div className="dialog-overlay absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
        <section
          aria-modal="true"
          className="dialog-panel relative z-10 w-full max-w-md rounded-3xl border border-line bg-card p-6 shadow-sheet"
          role="dialog"
        >
          <h3 className="font-display text-2xl">Nova senha</h3>
          <p className="mt-2 text-sm text-ink/65">Define uma senha nova para {name}.</p>
          <form action={action} className="mt-5 space-y-3">
            <input name="userId" type="hidden" value={userId} />
            <PasswordField autoComplete="new-password" label="Senha" minLength={6} name="password" />
            <PasswordField autoComplete="new-password" label="Confirmar senha" minLength={6} name="confirmPassword" />
            {state.error ? <FormError message={state.error} /> : null}
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={onClose} type="button">
                Cancelar
              </button>
              <button className="btn-primary" disabled={pending} type="submit">
                {pending ? "Salvando..." : "Salvar senha"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Portal>
  );
}
