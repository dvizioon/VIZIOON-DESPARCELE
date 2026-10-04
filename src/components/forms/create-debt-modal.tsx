"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { createDebtAction } from "@/app/actions/debt";
import type { ActionState } from "@/app/actions/auth";
import { FormError } from "@/components/forms/auth-forms";
import { AppIcon } from "@/components/ui/icon";
import { HiddenScroll } from "@/components/ui/hidden-scroll";
import { Portal } from "@/components/ui/portal";
import { NoteEditor } from "@/components/notes/note-editor";
import { SearchSelect } from "@/components/ui/search-select";

const initial: ActionState = { error: null };

export type DebtModalMember = {
  userId: string;
  userName: string;
  userEmail?: string;
};

type CreateDebtModalProps = {
  workspaceId: string;
  members: DebtModalMember[];
  currentUserId: string;
  defaultDueDate: string;
  shared: boolean;
  triggerLabel?: string;
  triggerClassName?: string;
};

export function CreateDebtModal({
  workspaceId,
  members,
  currentUserId,
  defaultDueDate,
  shared,
  triggerLabel = "Nova dívida",
  triggerClassName = "btn-primary",
}: CreateDebtModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className={triggerClassName} onClick={() => setOpen(true)} type="button">
        <AppIcon name="tabler:plus" className="size-4" />
        {triggerLabel}
      </button>
      {open ? (
        <DebtDialog
          currentUserId={currentUserId}
          defaultDueDate={defaultDueDate}
          members={members}
          onClose={() => setOpen(false)}
          shared={shared}
          workspaceId={workspaceId}
        />
      ) : null}
    </>
  );
}

function DebtDialog({
  workspaceId,
  members,
  currentUserId,
  defaultDueDate,
  shared,
  onClose,
}: Omit<CreateDebtModalProps, "triggerLabel" | "triggerClassName"> & { onClose: () => void }) {
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const action = createDebtAction.bind(null, workspaceId);
  const [state, formAction, pending] = useActionState(action, initial);
  const [ownerId, setOwnerId] = useState(currentUserId);
  const [note, setNote] = useState("");

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
        className="dialog-overlay absolute inset-0 bg-ink/45 backdrop-blur-sm"
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
        className="dialog-panel relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-sheet"
        ref={panelRef}
        role="dialog"
      >
        <HiddenScroll className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink/50">Nova dívida</p>
            <h2 className="font-display text-3xl" id={titleId}>
              Cadastrar agora
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

        <form action={formAction} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-ink/70">Nome</span>
            <input
              className="field"
              name="name"
              placeholder="Cartão, financiamento, loja"
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm text-ink/70">Valor total</span>
              <input className="field" name="totalAmount" placeholder="1200,00" required />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm text-ink/70">Parcelas</span>
              <input className="field" max={360} min={1} name="installmentCount" required type="number" />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm text-ink/70">Primeiro vencimento</span>
            <input
              className="field"
              defaultValue={defaultDueDate}
              name="firstDueDate"
              required
              type="date"
            />
          </label>
          {shared ? (
            <label className="block space-y-1.5">
              <span className="text-sm text-ink/70">De quem é a dívida</span>
              <SearchSelect
                name="ownerId"
                options={members.map((member) => ({
                  value: member.userId,
                  label: member.userName,
                  hint: member.userEmail,
                }))}
                placeholder="Escolher pessoa"
                searchPlaceholder="Buscar pelo nome"
                value={ownerId}
                onChange={setOwnerId}
              />
            </label>
          ) : (
            <input name="ownerId" type="hidden" value={currentUserId} />
          )}
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white/60 px-3 py-3">
            <input className="mt-1 size-4 accent-[var(--pine)]" name="isLoan" type="checkbox" value="1" />
            <span>
              <span className="block text-sm font-medium text-ink">Empréstimo</span>
              <span className="mt-0.5 block text-xs text-ink/55">
                Desconta na conta todo mês — no vencimento a parcela fica paga sozinha.
              </span>
            </span>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-ink/70">Nota</span>
            <input name="note" type="hidden" value={note} />
            <NoteEditor
              height={220}
              placeholder="O que combina lembrar: acordo, loja, por que parcelou..."
              value={note}
              onChange={setNote}
            />
          </label>
          {state.error ? <FormError message={state.error} /> : null}
          <button className="btn-primary w-full" disabled={pending} type="submit">
            {pending ? "Salvando..." : "Gerar parcelas"}
          </button>
        </form>
        </HiddenScroll>
      </section>
    </div>
    </Portal>
  );
}
