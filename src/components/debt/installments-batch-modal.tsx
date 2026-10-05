"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  batchDeleteInstallmentsAction,
  batchUpdateInstallmentsAction,
} from "@/app/actions/debt";
import { FormError } from "@/components/forms/auth-forms";
import { useDialogMotion } from "@/components/motion/use-dialog-motion";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FancyCheckbox } from "@/components/ui/fancy-checkbox";
import { AppIcon } from "@/components/ui/icon";
import { MonthBadge } from "@/components/ui/month-badge";
import { HiddenScroll } from "@/components/ui/hidden-scroll";
import { Portal } from "@/components/ui/portal";
import { formatDateFull, parseDateInput } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";

export type BatchInstallmentRow = {
  id: string;
  number: number;
  amountCents: number;
  dueDate: string;
  status: "PENDING" | "PAID";
};

export function InstallmentsBatchModal({
  workspaceId,
  debtId,
  installments,
}: {
  workspaceId: string;
  debtId: string;
  installments: BatchInstallmentRow[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn-ghost" onClick={() => setOpen(true)} type="button">
        <AppIcon name="tabler:list-check" className="size-4" />
        Parcelas
      </button>
      {open ? (
        <BatchDialog
          debtId={debtId}
          installments={installments}
          workspaceId={workspaceId}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function BatchDialog({
  workspaceId,
  debtId,
  installments,
  onClose,
}: {
  workspaceId: string;
  debtId: string;
  installments: BatchInstallmentRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(installments);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ackDelete, setAckDelete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setRows(installments);
  }, [installments]);

  useDialogMotion(onClose, pending || confirmDelete);

  const allIds = useMemo(() => rows.map((item) => item.id), [rows]);
  const allSelected = selected.size > 0 && selected.size === allIds.length;
  const canDeleteSelected = selected.size > 0 && selected.size < rows.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll(next: boolean) {
    setSelected(next ? new Set(allIds) : new Set());
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <div
          className="dialog-overlay absolute inset-0 bg-ink/45 backdrop-blur-sm"
          onClick={() => {
            if (!pending && !confirmDelete) {
              onClose();
            }
          }}
        />
        <section
          aria-modal="true"
          className="dialog-panel relative z-10 flex h-[min(42rem,92vh)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-sheet"
          role="dialog"
        >
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
            <div>
              <p className="text-sm text-ink/50">Dívida</p>
              <h2 className="font-display text-3xl">Parcelas</h2>
              <p className="mt-1 text-sm text-ink/60">
                Selecione e aplique valor e/ou o dia do vencimento. O mês de cada parcela fica.
              </p>
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

          <HiddenScroll className="px-5 pb-5 sm:px-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <FancyCheckbox
                checked={allSelected}
                disabled={pending || rows.length === 0}
                label={allSelected ? "Limpar seleção" : "Selecionar todas"}
                onChange={toggleAll}
              />
              <span className="text-xs text-ink/55">{selected.size} selecionada(s)</span>
            </div>

            <ul className="mb-5 max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-line bg-white/50 p-2">
              {rows.map((item) => {
                const checked = selected.has(item.id);
                const due = parseDateInput(item.dueDate);
                return (
                  <li className="rounded-xl px-1 py-1 hover:bg-white/80" key={item.id}>
                    <FancyCheckbox
                      checked={checked}
                      className="w-full"
                      disabled={pending}
                      label={`Parcela ${item.number}${item.status === "PAID" ? " · paga" : ""}`}
                      onChange={() => toggle(item.id)}
                    />
                    <div className="mt-1 flex flex-wrap items-center gap-2 px-1 text-xs text-ink/55">
                      <MonthBadge date={due} />
                      <span>
                        {formatDateFull(due)} · {formatBRL(item.amountCents)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <form
              action={async (formData) => {
                setPending(true);
                setError(null);
                setInfo(null);
                for (const id of selected) {
                  formData.append("installmentId", id);
                }
                const result = await batchUpdateInstallmentsAction(workspaceId, debtId, formData);
                setPending(false);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setInfo(result.message ?? "Atualizado.");
                setSelected(new Set());
                setAmount("");
                setDueDay("");
                router.refresh();
              }}
              className="space-y-3 border-t border-line pt-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-sm text-ink/70">Novo valor (opcional)</span>
                  <input
                    className="field"
                    name="amount"
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="500,00"
                    value={amount}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-sm text-ink/70">Dia do vencimento (opcional)</span>
                  <input
                    className="field"
                    max={31}
                    min={1}
                    name="dueDay"
                    onChange={(event) => setDueDay(event.target.value)}
                    placeholder="10"
                    type="number"
                    value={dueDay}
                  />
                </label>
              </div>
              <p className="text-xs text-ink/55">
                Ex.: dia 10 nas parcelas 2–13. A 1ª pode continuar no dia 14.
              </p>
              {error ? <FormError message={error} /> : null}
              {info ? <p className="text-sm text-moss">{info}</p> : null}
              <button
                className="btn-primary w-full"
                disabled={pending || selected.size === 0}
                type="submit"
              >
                {pending ? "Aplicando..." : "Aplicar nas selecionadas"}
              </button>
            </form>

            <div className="mt-5 space-y-3 border-t border-line pt-4">
              <FancyCheckbox
                checked={ackDelete}
                className="w-full"
                disabled={pending || !canDeleteSelected}
                label="Quero excluir as selecionadas"
                tip="Marque para liberar a exclusão em lote. Deixe ao menos uma parcela."
                onChange={setAckDelete}
              />
              <button
                className="btn-ghost w-full text-clay disabled:opacity-40"
                disabled={pending || !ackDelete || !canDeleteSelected}
                onClick={() => setConfirmDelete(true)}
                type="button"
              >
                <AppIcon className="size-4" name="tabler:trash" />
                Excluir selecionadas
              </button>
            </div>
          </HiddenScroll>
        </section>
      </div>

      <ConfirmDialog
        cancelLabel="Manter"
        confirmLabel="Excluir"
        danger
        description={`${selected.size} parcela(s) somem da dívida. As restantes são renumeradas. Não dá para desfazer.`}
        open={confirmDelete}
        pending={pending}
        title="Excluir parcelas selecionadas?"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setPending(true);
          setError(null);
          void batchDeleteInstallmentsAction(workspaceId, debtId, [...selected]).then((result) => {
            setPending(false);
            setConfirmDelete(false);
            if (result.error) {
              setError(result.error);
              return;
            }
            setInfo(result.message ?? "Excluídas.");
            setSelected(new Set());
            setAckDelete(false);
            setRows((prev) => prev.filter((row) => !selected.has(row.id)));
            router.refresh();
          });
        }}
      />
    </Portal>
  );
}
