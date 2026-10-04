"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUserAction } from "@/app/actions/admin";
import type { ActionState } from "@/app/actions/auth";
import { PasswordField } from "@/components/auth/password-field";
import { FormError } from "@/components/forms/auth-forms";

const initial: ActionState = { error: null };

export function AdminCreateUserForm() {
  const [state, action, pending] = useActionState(createUserAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <form action={action} className="sheet space-y-4" data-reveal ref={formRef}>
      <div>
        <h3 className="font-display text-2xl">Nova conta</h3>
        <p className="mt-1 text-sm text-ink/55">Cria um usuário pra ele já poder entrar.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm text-ink/70">Nome completo</span>
          <input className="field" minLength={5} name="name" placeholder="Nome e sobrenome" required />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-ink/70">E-mail</span>
          <input className="field" name="email" placeholder="pessoa@email.com" required type="email" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-ink/70">Papel</span>
          <select className="field" defaultValue="MEMBER" name="role">
            <option value="MEMBER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <PasswordField
          autoComplete="new-password"
          label="Senha"
          minLength={6}
          name="password"
          placeholder="Mínimo 6 caracteres"
        />
        <PasswordField
          autoComplete="new-password"
          label="Repetir senha"
          minLength={6}
          name="confirmPassword"
          placeholder="Repete a senha"
        />
      </div>

      {state.error ? <FormError message={state.error} /> : null}
      {state.ok ? (
        <p className="text-sm text-pine-dark">Conta criada. A pessoa já pode entrar.</p>
      ) : null}

      <button className="btn-primary" disabled={pending} type="submit">
        {pending ? "Criando..." : "Criar conta"}
      </button>
    </form>
  );
}
