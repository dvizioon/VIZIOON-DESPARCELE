"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { createWorkspaceAction } from "@/app/actions/workspace";
import type { ActionState } from "@/app/actions/auth";
import { FormError } from "@/components/forms/auth-forms";
import { AppIcon } from "@/components/ui/icon";
import { Portal } from "@/components/ui/portal";

const initial: ActionState = { error: null };

type CreateWorkspaceModalProps = {
  triggerLabel?: string;
  triggerClassName?: string;
  compact?: boolean;
};

export function CreateWorkspaceModal({
  triggerLabel = "Novo espaço",
  triggerClassName = "btn-primary",
  compact = false,
}: CreateWorkspaceModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)} type="button">
        <AppIcon name="tabler:plus" className="size-4" />
        {compact ? <span className="sr-only">{triggerLabel}</span> : triggerLabel}
      </button>
      {open ? <WorkspaceDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function WorkspaceDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [state, action, pending] = useActionState(createWorkspaceAction, initial);

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
        className="relative z-10 w-full max-w-md rounded-3xl border border-line bg-card p-5 shadow-sheet sm:p-6"
        ref={panelRef}
        role="dialog"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink/50">Novo espaço</p>
            <h2 className="font-display text-3xl" id={titleId}>
              Como vai chamar?
            </h2>
          </div>
          <button
            className="rounded-full p-2 text-ink/55 transition hover:bg-white hover:text-ink"
            disabled={pending}
            onClick={onClose}
            type="button"
          >
            <AppIcon name="tabler:x" className="size-5" />
            <span className="sr-only">Fechar</span>
          </button>
        </div>

        <form action={action} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-ink/70">Nome</span>
            <input
              className="field"
              minLength={2}
              name="name"
              placeholder="Casa, Viagem, Pessoal"
              required
            />
          </label>
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="sr-only">Tipo</legend>
            <label className="choice">
              <input
                className="peer sr-only"
                defaultChecked
                name="type"
                type="radio"
                value="PERSONAL"
              />
              <span className="choice-card transition peer-checked:border-pine peer-checked:bg-pine-soft">
                <AppIcon name="tabler:user" className="mr-2 inline size-4" />
                Pessoal
              </span>
            </label>
            <label className="choice">
              <input className="peer sr-only" name="type" type="radio" value="SHARED" />
              <span className="choice-card transition peer-checked:border-pine peer-checked:bg-pine-soft">
                <AppIcon name="tabler:users" className="mr-2 inline size-4" />
                Compartilhado
              </span>
            </label>
          </fieldset>
          {state.error ? <FormError message={state.error} /> : null}
          <button className="btn-primary w-full" disabled={pending} type="submit">
            {pending ? "Criando..." : "Criar e entrar"}
          </button>
        </form>
      </section>
    </div>
    </Portal>
  );
}
