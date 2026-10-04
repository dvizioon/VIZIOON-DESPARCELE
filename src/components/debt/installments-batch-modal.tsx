"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { batchUpdateInstallmentsAction } from "@/app/actions/debt";
import { FormError } from "@/components/forms/auth-forms";
import { useDialogMotion } from "@/components/motion/use-dialog-motion";
import { AppIcon } from "@/components/ui/icon";
import { MonthBadge } from "@/components/ui/month-badge";
import { HiddenScroll } from "@/components/ui/hidden-scroll";
import { Portal } from "@/components/ui/portal";
import { formatDateFull } from "@/shared/utils/date";
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useDialogMotion(onClose, pending);

  const allIds = useMemo(() => installments.map((item) => item.id), [installments]);
  const allSelected = selected.size > 0 && selected.size === allIds.length;

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

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

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
            <div className="mb-3 flex items-center justify-between gap-2">
              <button className="btn-ghost text-xs" onClick={toggleAll} type="button">
                {allSelected ? "Limpar seleção" : "Selecionar todas"}
              </button>
              <span className="text-xs text-ink/55">{selected.size} selecionada(s)</span>
            </div>

            <ul className="mb-5 max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-line bg-white/50 p-2">
              {installments.map((item) => {
                const checked = selected.has(item.id);
                return (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-white">
                      <input
                        checked={checked}
                        className="size-4 accent-[var(--pine)]"
                        onChange={() => toggle(item.id)}
                        type="checkbox"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          Parcela {item.number}
                          <MonthBadge date={new Date(item.dueDate)} />
                          {item.status === "PAID" ? (
                            <span className="text-xs text-moss">paga</span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink/55">
                          {formatDateFull(new Date(item.dueDate))} · {formatBRL(item.amountCents)}
                        </span>
                      </span>
                    </label>
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
          </HiddenScroll>
        </section>
      </div>
    </Portal>
  );
}
