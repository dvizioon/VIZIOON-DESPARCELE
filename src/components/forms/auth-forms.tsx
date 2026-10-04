"use client";

import { useActionState, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  type ActionState,
} from "@/app/actions/auth";
import { PasswordField } from "@/components/auth/password-field";
import { AppIcon } from "@/components/ui/icon";

const initial: ActionState = { error: null };

export function FormError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-2 rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">
      <AppIcon name="tabler:alert-circle" className="size-4 shrink-0" />
      {message}
    </p>
  );
}

function AuthCard({
  kicker,
  title,
  subtitle,
  children,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.querySelectorAll("[data-auth-item]"),
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power3.out" },
      );
    }, root);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef}>
      <p className="text-sm font-medium text-pine" data-auth-item>
        {kicker}
      </p>
      <h1 className="mt-2 font-display text-4xl leading-tight" data-auth-item>
        {title}
      </h1>
      <p className="mt-3 text-ink/60" data-auth-item>
        {subtitle}
      </p>
      <div className="mt-8" data-auth-item>
        {children}
      </div>
    </div>
  );
}

export function LoginForm({
  callbackUrl,
  restored,
  disabledAccount,
}: {
  callbackUrl: string;
  restored?: boolean;
  disabledAccount?: boolean;
}) {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <AuthCard
      kicker="Entrar"
      title="Bom te ver de novo"
      subtitle="Suas dívidas, parcelas e combinados continuam no mesmo lugar."
    >
      {disabledAccount ? (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-clay/10 px-3 py-2 text-sm text-clay">
          <AppIcon name="tabler:user-off" className="size-4" />
          Essa conta foi desativada.
        </p>
      ) : null}
      {restored ? (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-pine-soft px-3 py-2 text-sm text-pine-dark">
          <AppIcon name="tabler:circle-check" className="size-4" />
          Senha nova pronta. Pode entrar.
        </p>
      ) : null}
      <form action={action} className="space-y-4">
        <input name="callbackUrl" type="hidden" value={callbackUrl} />
        <label className="block space-y-1.5">
          <span className="text-sm text-ink/70">E-mail</span>
          <input
            autoComplete="email"
            className="field"
            name="email"
            placeholder="voce@email.com"
            required
            type="email"
          />
        </label>
        <PasswordField autoComplete="current-password" label="Senha" name="password" placeholder="Sua senha" />
        <div className="flex justify-end">
          <Link className="text-sm font-medium text-pine" href="/recuperar-senha">
            Esqueci minha senha
          </Link>
        </div>
        {state.error ? <FormError message={state.error} /> : null}
        <button className="btn-primary w-full" disabled={pending} type="submit">
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        Novo por aqui?{" "}
        <Link className="font-semibold text-pine" href="/register">
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <AuthCard
      kicker="Começar"
      title="Um espaço para vocês dois"
      subtitle="Cria a conta. Depois entra a primeira dívida. O resto o Desparcele organiza."
    >
      <form action={action} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm text-ink/70">Nome completo</span>
          <input
            autoComplete="name"
            className="field"
            minLength={5}
            name="name"
            placeholder="Nome e sobrenome"
            required
          />
          <span className="block text-xs text-ink/50">Escreve nome e sobrenome, como você assina.</span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm text-ink/70">E-mail</span>
          <input
            autoComplete="email"
            className="field"
            name="email"
            placeholder="voce@email.com"
            required
            type="email"
          />
        </label>
        <PasswordField autoComplete="new-password" label="Senha" minLength={6} name="password" placeholder="Mínimo 6 caracteres" />
        <PasswordField
          autoComplete="new-password"
          label="Repetir senha"
          minLength={6}
          name="confirmPassword"
          placeholder="Repete a senha"
        />
        {state.error ? <FormError message={state.error} /> : null}
        <button className="btn-primary w-full" disabled={pending} type="submit">
          {pending ? "Criando..." : "Criar minha conta"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        Já tem conta?{" "}
        <Link className="font-semibold text-pine" href="/login">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initial);

  if (state.ok) {
    return (
      <AuthCard
        kicker="Pedido feito"
        title="Olha a caixa de entrada"
        subtitle="Se esse e-mail tiver conta no Desparcele, o próximo passo chega por lá."
      >
        <Link className="btn-primary w-full" href="/login">
          Voltar ao login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      kicker="Recuperar"
      title="Esqueci minha senha"
      subtitle="Diz o e-mail da conta. A gente abre o caminho para criar outra."
    >
      <form action={action} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm text-ink/70">E-mail</span>
          <input
            autoComplete="email"
            className="field"
            name="email"
            placeholder="voce@email.com"
            required
            type="email"
          />
        </label>
        {state.error ? <FormError message={state.error} /> : null}
        <button className="btn-primary w-full" disabled={pending} type="submit">
          {pending ? "Enviando..." : "Enviar pedido"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        Lembrou?{" "}
        <Link className="font-semibold text-pine" href="/login">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);

  return (
    <AuthCard
      kicker="Nova senha"
      title="Escolhe outra"
      subtitle="Depois disso você entra de novo, no mesmo espaço de sempre."
    >
      <form action={action} className="space-y-4">
        <input name="token" type="hidden" value={token} />
        <PasswordField autoComplete="new-password" label="Nova senha" minLength={6} name="password" placeholder="Nova senha" />
        <PasswordField
          autoComplete="new-password"
          label="Repetir senha"
          minLength={6}
          name="confirmPassword"
          placeholder="Repete a senha"
        />
        {state.error ? <FormError message={state.error} /> : null}
        <button className="btn-primary w-full" disabled={pending} type="submit">
          {pending ? "Salvando..." : "Salvar senha"}
        </button>
      </form>
    </AuthCard>
  );
}
