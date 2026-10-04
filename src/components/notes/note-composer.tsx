"use client";

import { useState } from "react";
import gsap from "gsap";
import { useEffect, useId, useRef } from "react";
import { createNoteAction } from "@/app/actions/note";
import { FormError } from "@/components/forms/auth-forms";
import { NoteEditor } from "@/components/notes/note-editor";
import { AppIcon } from "@/components/ui/icon";
import { HiddenScroll } from "@/components/ui/hidden-scroll";
import { Portal } from "@/components/ui/portal";

type NoteComposerProps = {
  workspaceId: string;
  debtId: string;
};

export function NoteComposer({ workspaceId, debtId }: NoteComposerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)} type="button">
        <AppIcon name="tabler:notes" className="size-4" />
        Adicionar nota
      </button>
      {open ? (
        <NoteDialog debtId={debtId} onClose={() => setOpen(false)} workspaceId={workspaceId} />
      ) : null}
    </>
  );
}

function NoteDialog({
  workspaceId,
  debtId,
  onClose,
}: NoteComposerProps & { onClose: () => void }) {
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("content", content);
    const result = await createNoteAction(workspaceId, debtId, formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onClose();
  }

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
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-sheet"
        ref={panelRef}
        role="dialog"
      >
        <HiddenScroll className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-ink/50">Nota da dívida</p>
            <h2 className="font-display text-3xl" id={titleId}>
              Registrar o que rolou
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

        <form action={onSubmit} className="space-y-4">
          <NoteEditor onChange={setContent} value={content} />
          <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-line bg-white px-4 py-3 text-sm text-ink/70">
            <span className="inline-flex items-center gap-2">
              <AppIcon name="tabler:paperclip" className="size-4" />
              Comprovantes
            </span>
            <input accept="image/*,.pdf" multiple name="attachments" type="file" />
          </label>
          {error ? <FormError message={error} /> : null}
          <button className="btn-primary w-full" disabled={pending} type="submit">
            {pending ? "Salvando..." : "Salvar nota"}
          </button>
        </form>
        </HiddenScroll>
      </section>
    </div>
    </Portal>
  );
}
