"use client";

import { useEffect, useId, useRef, useState } from "react";
import gsap from "gsap";
import { DebtCreateForm, type DebtCreateMember } from "@/components/forms/debt-create-form";
import { AppIcon } from "@/components/ui/icon";
import { HiddenScroll } from "@/components/ui/hidden-scroll";
import { Portal } from "@/components/ui/portal";

type CreateDebtModalProps = {
  workspaceId: string;
  members: DebtCreateMember[];
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
      if (event.key === "Escape") {
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
  }, [onClose]);

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <div
          className="dialog-overlay absolute inset-0 bg-ink/45 backdrop-blur-sm"
          onClick={onClose}
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
                onClick={onClose}
                type="button"
              >
                <AppIcon name="tabler:x" className="size-5" />
                <span className="sr-only">Fechar</span>
              </button>
            </div>

            <DebtCreateForm
              currentUserId={currentUserId}
              defaultDueDate={defaultDueDate}
              members={members}
              shared={shared}
              workspaceId={workspaceId}
            />
          </HiddenScroll>
        </section>
      </div>
    </Portal>
  );
}
