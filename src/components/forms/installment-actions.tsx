"use client";

import { useState } from "react";
import Link from "next/link";
import {
  markPaidAction,
  removeReceiptAction,
  revertPaidAction,
  setInstallmentReminderDisabledAction,
} from "@/app/actions/debt";
import { FormError } from "@/components/forms/auth-forms";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/ui/icon";

type InstallmentActionsProps = {
  workspaceId: string;
  debtId: string;
  installmentId: string;
  paid: boolean;
  receiptUrl: string | null;
  reminderDisabled?: boolean;
  remindersOnDebt?: boolean;
};

type ConfirmKind = "receipt" | "unpay" | null;

export function InstallmentActions({
  workspaceId,
  debtId,
  installmentId,
  paid,
  receiptUrl,
  reminderDisabled = false,
  remindersOnDebt = false,
}: InstallmentActionsProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [noMail, setNoMail] = useState(reminderDisabled);

  async function run(task: () => Promise<{ error: string | null }>) {
    setPending(true);
    setError(null);
    const result = await task();
    setPending(false);
    setConfirm(null);
    if (result.error) {
      setError(result.error);
    }
  }

  if (!paid) {
    return (
      <form
        action={async (formData) => {
          await run(() => markPaidAction(workspaceId, debtId, installmentId, formData));
        }}
        className="mt-4 flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-line bg-white px-3 py-2 text-sm text-ink/70 transition hover:border-pine">
            <AppIcon name="tabler:paperclip" className="size-4" />
            <span>Comprovante</span>
            <input className="w-full min-w-0 text-xs" name="receipt" type="file" accept="image/*,.pdf" />
          </label>
          <button className="btn-primary sm:w-auto" disabled={pending} type="submit">
            {pending ? "Salvando..." : "Marcar paga"}
          </button>
        </div>
        {remindersOnDebt ? (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink/65">
            <input
              checked={noMail}
              className="size-4 accent-[var(--pine)]"
              disabled={pending}
              onChange={(event) => {
                const next = event.target.checked;
                setNoMail(next);
                const formData = new FormData();
                formData.set("disabled", next ? "1" : "0");
                void setInstallmentReminderDisabledAction(
                  workspaceId,
                  debtId,
                  installmentId,
                  formData,
                ).then((result) => {
                  if (result.error) {
                    setNoMail(!next);
                    setError(result.error);
                  }
                });
              }}
              type="checkbox"
            />
            Não avisar esta parcela por e-mail
          </label>
        ) : null}
        {error ? <FormError message={error} /> : null}
      </form>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {receiptUrl ? (
          <>
            <Link className="btn-ghost" href={receiptUrl} target="_blank">
              <AppIcon name="tabler:file-invoice" className="size-4" />
              Ver comprovante
            </Link>
            <button className="btn-ghost" disabled={pending} onClick={() => setConfirm("receipt")} type="button">
              <AppIcon name="tabler:trash" className="size-4" />
              Remover comprovante
            </button>
          </>
        ) : null}
        <button
          className="btn-ghost text-clay"
          disabled={pending}
          onClick={() => setConfirm("unpay")}
          type="button"
        >
          <AppIcon name="tabler:arrow-back-up" className="size-4" />
          Desmarcar paga
        </button>
      </div>
      {error ? <FormError message={error} /> : null}
      <ConfirmDialog
        confirmLabel={confirm === "receipt" ? "Remover comprovante" : "Desmarcar"}
        danger
        description={
          confirm === "receipt"
            ? "O arquivo some. A parcela continua marcada como paga."
            : "A parcela volta para pendente e o comprovante some."
        }
        open={confirm !== null}
        pending={pending}
        title={confirm === "receipt" ? "Remover este comprovante?" : "Desmarcar esta parcela?"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === "receipt") {
            void run(() => removeReceiptAction(workspaceId, debtId, installmentId));
            return;
          }

          void run(() => revertPaidAction(workspaceId, debtId, installmentId));
        }}
      />
    </div>
  );
}
