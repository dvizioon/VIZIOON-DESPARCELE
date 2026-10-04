"use client";

import { useState } from "react";
import { deleteDebtAction, renameDebtAction, setDebtLoanAction } from "@/app/actions/debt";
import { FormError } from "@/components/forms/auth-forms";
import { useDialogMotion } from "@/components/motion/use-dialog-motion";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/ui/icon";
import { HiddenScroll } from "@/components/ui/hidden-scroll";
import { Portal } from "@/components/ui/portal";

export function DebtSettingsModal({
  workspaceId,
  debtId,
  debtName,
  isLoan,
}: {
  workspaceId: string;
  debtId: string;
  debtName: string;
  isLoan: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="rounded-full p-2 text-ink/50 transition hover:bg-white hover:text-ink"
        onClick={() => setOpen(true)}
        type="button"
      >
        <AppIcon name="tabler:settings" className="size-5" />
        <span className="sr-only">Ajustes da dívida</span>
      </button>
      {open ? (
        <DebtSettingsDialog
          debtId={debtId}
          debtName={debtName}
          isLoan={isLoan}
          workspaceId={workspaceId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function DebtSettingsDialog({
  workspaceId,
  debtId,
  debtName,
  isLoan,
  onClose,
}: {
  workspaceId: string;
  debtId: string;
  debtName: string;
  isLoan: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState(debtName);
  const [loan, setLoan] = useState(isLoan);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [loanPending, setLoanPending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useDialogMotion(onClose, pending || loanPending || deleting || confirm);

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <div
          className="dialog-overlay absolute inset-0 bg-ink/45 backdrop-blur-sm"
          onClick={() => {
            if (!confirm && !pending && !loanPending && !deleting) {
              onClose();
            }
          }}
        />
        <section
          aria-modal="true"
          className="dialog-panel relative z-10 flex h-[min(40rem,92vh)] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-sheet"
          role="dialog"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
            <div>
              <p className="text-sm text-ink/50">Dívida</p>
              <h2 className="font-display text-3xl">Ajustes</h2>
            </div>
            <button
              className="rounded-full p-2 text-ink/50 hover:bg-white hover:text-ink"
              onClick={onClose}
              type="button"
            >
              <AppIcon name="tabler:x" className="size-5" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          <HiddenScroll className="px-5 py-5 sm:px-6">
            <form
              action={async (formData) => {
                setPending(true);
                setError(null);
                setSaved(false);
                const result = await renameDebtAction(workspaceId, debtId, formData);
                setPending(false);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setSaved(true);
              }}
              className="space-y-3"
            >
              <label className="block space-y-1.5">
                <span className="text-sm text-ink/70">Nome</span>
                <input
                  className="field"
                  minLength={2}
                  name="name"
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                  }}
                  placeholder="Cartão, financiamento, loja"
                  required
                  value={name}
                />
              </label>
              {error ? <FormError message={error} /> : null}
              {saved ? <p className="text-sm text-moss">Nome salvo.</p> : null}
              <button className="btn-primary w-full" disabled={pending} type="submit">
                {pending ? "Salvando..." : "Salvar nome"}
              </button>
            </form>

            <div className="mt-6 space-y-3 border-t border-line pt-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white/60 px-3 py-3">
                <input
                  checked={loan}
                  className="mt-1 size-4 accent-[var(--pine)]"
                  disabled={loanPending}
                  onChange={(event) => {
                    const next = event.target.checked;
                    setLoan(next);
                    setLoanPending(true);
                    setError(null);
                    const formData = new FormData();
                    formData.set("isLoan", next ? "1" : "0");
                    void setDebtLoanAction(workspaceId, debtId, formData).then((result) => {
                      setLoanPending(false);
                      if (result.error) {
                        setLoan(!next);
                        setError(result.error);
                      }
                    });
                  }}
                  type="checkbox"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">Empréstimo</span>
                  <span className="mt-0.5 block text-xs text-ink/55">
                    No vencimento a parcela é marcada como paga sozinha.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-8 space-y-3 border-t border-line pt-5">
              <p className="text-sm text-ink/60">
                Apagar tira a dívida, as parcelas, as notas e os comprovantes. Isso não volta.
              </p>
              <button className="btn-ghost w-full text-clay" onClick={() => setConfirm(true)} type="button">
                <AppIcon name="tabler:trash" className="size-4" />
                Apagar dívida
              </button>
            </div>
          </HiddenScroll>
        </section>
      </div>

      <ConfirmDialog
        confirmLabel="Apagar"
        danger
        description={`${name} some com as parcelas, notas e comprovantes. Não tem como desfazer.`}
        open={confirm}
        pending={deleting}
        title={`Apagar ${name}?`}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setDeleting(true);
          void deleteDebtAction(workspaceId, debtId).then((result) => {
            if (result.error) {
              setDeleting(false);
              setConfirm(false);
              setError(result.error);
            }
          });
        }}
      />
    </Portal>
  );
}
