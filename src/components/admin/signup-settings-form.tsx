"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  setAllowPublicSignupAction,
  setSignupFieldsAction,
} from "@/app/actions/admin";
import { FormError } from "@/components/forms/auth-forms";
import type { SignupFields } from "@/modules/admin/domain/platform";

export function SignupSettingsForm({
  allowPublicSignup,
  signupFields,
}: {
  allowPublicSignup: boolean;
  signupFields: SignupFields;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(allowPublicSignup);
  const [fields, setFields] = useState(signupFields);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleSignup(next: boolean) {
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

  function toggleField(key: keyof SignupFields, next: boolean) {
    if (key === "email" || key === "password") {
      return;
    }
    const previous = fields;
    const updated = { ...fields, [key]: next, email: true, password: true };
    setError(null);
    setFields(updated);
    startTransition(async () => {
      const result = await setSignupFieldsAction(updated);
      if (result.error) {
        setFields(previous);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
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
            onClick={() => toggleSignup(!enabled)}
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
      </div>

      <div className="sheet space-y-4">
        <div>
          <h3 className="font-display text-2xl">Campos do cadastro</h3>
          <p className="mt-2 max-w-md text-sm text-ink/60">
            Escolha o que aparece na tela de criar conta. E-mail e senha ficam sempre ligados.
          </p>
        </div>

        <ul className="divide-y divide-ink/10">
          <FieldToggle
            description="Nome e sobrenome no formulário."
            disabled={pending}
            enabled={fields.name}
            label="Nome completo"
            onToggle={(next) => toggleField("name", next)}
          />
          <FieldToggle
            description="Necessário para entrar — não dá para desligar."
            disabled
            enabled={fields.email}
            label="E-mail"
            locked
            onToggle={() => undefined}
          />
          <FieldToggle
            description="Telefone opcional no cadastro."
            disabled={pending}
            enabled={fields.phone}
            label="Telefone"
            onToggle={(next) => toggleField("phone", next)}
          />
          <FieldToggle
            description="Necessário para entrar — não dá para desligar."
            disabled
            enabled={fields.password}
            label="Senha"
            locked
            onToggle={() => undefined}
          />
        </ul>
      </div>

      {error ? <FormError message={error} /> : null}
    </div>
  );
}

function FieldToggle({
  label,
  description,
  enabled,
  disabled,
  locked,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  locked?: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="font-medium text-ink">
          {label}
          {locked ? <span className="ml-2 text-xs font-normal text-ink/45">sempre on</span> : null}
        </p>
        <p className="mt-0.5 text-sm text-ink/55">{description}</p>
      </div>
      <button
        aria-pressed={enabled}
        className={`relative h-9 w-16 shrink-0 rounded-full transition ${
          enabled ? "bg-pine" : "bg-ink/20"
        } ${disabled || locked ? "opacity-60" : ""}`}
        disabled={disabled || locked}
        onClick={() => onToggle(!enabled)}
        type="button"
      >
        <span
          className={`absolute top-1 size-7 rounded-full bg-white shadow transition ${
            enabled ? "left-8" : "left-1"
          }`}
        />
        <span className="sr-only">
          {enabled ? `Desativar ${label}` : `Ativar ${label}`}
        </span>
      </button>
    </li>
  );
}
