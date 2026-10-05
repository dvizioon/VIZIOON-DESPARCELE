"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  changeInstallmentPayerAction,
  deleteInstallmentAction,
  markPaidAction,
  removeReceiptAction,
  revertPaidAction,
  setInstallmentReminderDisabledAction,
} from "@/app/actions/debt";
import { FormError } from "@/components/forms/auth-forms";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AppIcon } from "@/components/ui/icon";
import { SearchSelect } from "@/components/ui/search-select";

export type InstallmentPayerOption = {
  userId: string;
  userName: string;
};

type InstallmentActionsProps = {
  workspaceId: string;
  debtId: string;
  installmentId: string;
  paid: boolean;
  paidByUserId: string | null;
  receiptUrl: string | null;
  members: InstallmentPayerOption[];
  currentUserId: string;
  reminderDisabled?: boolean;
  remindersOnDebt?: boolean;
  /** Impede apagar a última cobrança da dívida. */
  canDelete?: boolean;
};

type ConfirmKind = "receipt" | "unpay" | "delete" | null;

export function InstallmentActions({
  workspaceId,
  debtId,
  installmentId,
  paid,
  paidByUserId,
  receiptUrl,
  members,
  currentUserId,
  reminderDisabled = false,
  remindersOnDebt = false,
  canDelete = true,
}: InstallmentActionsProps) {
  const defaultPayer = paidByUserId ?? currentUserId;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [noMail, setNoMail] = useState(reminderDisabled);
  const [payerId, setPayerId] = useState(defaultPayer);

  useEffect(() => {
    setPayerId(paidByUserId ?? currentUserId);
  }, [paidByUserId, currentUserId]);

  const payerOptions = members.map((item) => ({
    value: item.userId,
    label: item.userName,
  }));
  const showPayerSelect = members.length > 1;

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

  async function savePayer(nextId: string) {
    setPayerId(nextId);
    if (!paid || nextId === paidByUserId) {
      return;
    }
    const formData = new FormData();
    formData.set("paidByUserId", nextId);
    await run(() => changeInstallmentPayerAction(workspaceId, debtId, installmentId, formData));
  }

  const deleteButton = canDelete ? (
    <button
      className="btn-ghost text-clay"
      disabled={pending}
      onClick={() => setConfirm("delete")}
      type="button"
    >
      <AppIcon name="tabler:trash" className="size-4" />
      Excluir
    </button>
  ) : null;

  const confirmDialog = (
    <ConfirmDialog
      cancelLabel={confirm === "delete" ? "Manter" : "Cancelar"}
      confirmLabel={
        confirm === "receipt"
          ? "Remover comprovante"
          : confirm === "unpay"
            ? "Desmarcar"
            : "Excluir cobrança"
      }
      danger
      description={
        confirm === "receipt"
          ? "O arquivo some. A parcela continua marcada como paga."
          : confirm === "unpay"
            ? "A parcela volta para pendente e o comprovante some."
            : "A cobrança some da lista e as demais são renumeradas. Não dá para desfazer."
      }
      open={confirm !== null}
      pending={pending}
      title={
        confirm === "receipt"
          ? "Remover este comprovante?"
          : confirm === "unpay"
            ? "Desmarcar esta parcela?"
            : "Excluir esta cobrança?"
      }
      onCancel={() => setConfirm(null)}
      onConfirm={() => {
        if (confirm === "receipt") {
          void run(() => removeReceiptAction(workspaceId, debtId, installmentId));
          return;
        }
        if (confirm === "unpay") {
          void run(() => revertPaidAction(workspaceId, debtId, installmentId));
          return;
        }
        void run(() => deleteInstallmentAction(workspaceId, debtId, installmentId));
      }}
    />
  );

  const payerField = showPayerSelect ? (
    <label className="block space-y-1 sm:min-w-[14rem] sm:flex-1">
      <span className="text-xs text-ink/55">Quem pagou</span>
      <SearchSelect
        disabled={pending}
        name={paid ? undefined : "paidByUserId"}
        options={payerOptions}
        placeholder="Quem pagou"
        searchPlaceholder="Buscar pessoa"
        value={payerId}
        onChange={(value) => {
          if (paid) {
            void savePayer(value);
            return;
          }
          setPayerId(value);
        }}
      />
    </label>
  ) : paid ? null : (
    <input name="paidByUserId" type="hidden" value={currentUserId} />
  );

  if (!paid) {
    return (
      <form
        action={async (formData) => {
          if (!formData.get("paidByUserId")) {
            formData.set("paidByUserId", payerId || currentUserId);
          }
          await run(() => markPaidAction(workspaceId, debtId, installmentId, formData));
        }}
        className="mt-4 flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {payerField}
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-line bg-white px-3 py-2 text-sm text-ink/70 transition hover:border-pine">
            <AppIcon name="tabler:paperclip" className="size-4" />
            <span>Comprovante</span>
            <input className="w-full min-w-0 text-xs" name="receipt" type="file" accept="image/*,.pdf" />
          </label>
          <button className="btn-primary sm:w-auto" disabled={pending} type="submit">
            {pending ? "Salvando..." : "Marcar paga"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">{deleteButton}</div>
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
        {confirmDialog}
      </form>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {payerField}
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
        {deleteButton}
      </div>
      {error ? <FormError message={error} /> : null}
      {confirmDialog}
    </div>
  );
}
