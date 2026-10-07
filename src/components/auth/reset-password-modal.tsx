"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { resetPasswordAction, type ActionState } from "@/app/actions/auth";
import { FormError } from "@/components/forms/auth-forms";
import { PasswordField } from "@/components/auth/password-field";
import { AppIcon } from "@/components/ui/icon";
import { Portal } from "@/components/ui/portal";

const initial: ActionState = { error: null };

/** Abre o modal de nova senha quando a URL traz `?redefinir=<token>` (link do e-mail com sessão ativa). */
export function ResetPasswordFromQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const token = searchParams.get("redefinir")?.trim() ?? "";
  const senhaOk = searchParams.get("senhaOk") === "1";
  const [dismissedOk, setDismissedOk] = useState(false);

  function clearQuery() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("redefinir");
    next.delete("senhaOk");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  useEffect(() => {
    if (!senhaOk || dismissedOk) {
      return;
    }
    const timer = window.setTimeout(() => {
      setDismissedOk(true);
      clearQuery();
    }, 4500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [senhaOk, dismissedOk]);

  return (
    <>
      {senhaOk && !dismissedOk ? (
        <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md sm:left-auto sm:right-6">
          <p className="flex items-center gap-2 rounded-2xl bg-pine px-4 py-3 text-sm text-white shadow-lg">
            <AppIcon name="tabler:circle-check" className="size-4 shrink-0" />
            Senha nova salva. Pode continuar.
            <button
              className="ml-auto text-white/80 hover:text-white"
              onClick={() => {
                setDismissedOk(true);
                clearQuery();
              }}
              type="button"
            >
              <AppIcon name="tabler:x" className="size-4" />
            </button>
          </p>
        </div>
      ) : null}
      {token ? <ResetPasswordDialog onClose={clearQuery} token={token} /> : null}
    </>
  );
}

function ResetPasswordDialog({ token, onClose }: { token: string; onClose: () => void }) {
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [state, action, pending] = useActionState(resetPasswordAction, initial);

  useEffect(() => {
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) {
      return;
    }

    const timeline = gsap.timeline();
    timeline.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" });
    timeline.fromTo(
      panel,
      { y: 24, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: "power3.out" },
      "<",
    );

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    }

    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      timeline.kill();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, pending]);

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <div
          className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
          onClick={() => {
            if (!pending) {
              onClose();
            }
          }}
          ref={overlayRef}
        />
        <section
          aria-labelledby={titleId}
          aria-modal="true"
          className="relative z-10 w-full max-w-md rounded-3xl bg-paper p-5 shadow-xl sm:p-6"
          ref={panelRef}
          role="dialog"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pine">Nova senha</p>
              <h2 className="mt-1 font-display text-3xl" id={titleId}>
                Escolhe outra
              </h2>
              <p className="mt-2 text-sm text-ink/60">
                O link vale por 1 hora. Depois disso peça outro pelo e-mail.
              </p>
            </div>
            <button
              aria-label="Fechar"
              className="rounded-full p-2 text-ink/50 hover:bg-ink/5 hover:text-ink"
              disabled={pending}
              onClick={onClose}
              type="button"
            >
              <AppIcon name="tabler:x" className="size-5" />
            </button>
          </div>

          <form action={action} className="space-y-4">
            <input name="token" type="hidden" value={token} />
            <PasswordField
              autoComplete="new-password"
              label="Nova senha"
              minLength={6}
              name="password"
              placeholder="Nova senha"
            />
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
        </section>
      </div>
    </Portal>
  );
}
