"use client";

import { AppIcon } from "@/components/ui/icon";
import { Portal } from "@/components/ui/portal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  pending = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <Portal>
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <div className="dialog-overlay absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onCancel} />
      <section
        aria-modal="true"
        className="dialog-panel relative z-10 w-full max-w-md rounded-3xl border border-line bg-card p-6 shadow-sheet"
        role="dialog"
      >
        <div className="mb-3 flex items-center gap-2 text-clay">
          <AppIcon name="tabler:alert-triangle" className="size-5" />
          <p className="text-sm font-medium">Confirme antes</p>
        </div>
        <h3 className="font-display text-2xl">{title}</h3>
        <p className="mt-2 text-sm text-ink/65">{description}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="btn-ghost" disabled={pending} onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button
            className={danger ? "btn-primary !bg-clay hover:!bg-clay/90" : "btn-primary"}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? "Aguarde..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
    </Portal>
  );
}
