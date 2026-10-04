"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDebtAction } from "@/app/actions/debt";
import type { ActionState } from "@/app/actions/auth";
import { FormError } from "@/components/forms/auth-forms";
import { NoteEditor } from "@/components/notes/note-editor";
import { SearchSelect } from "@/components/ui/search-select";
import type { DebtKind } from "@/modules/debt/domain/debt";
import { generateInstallments } from "@/modules/installment/domain/generate-installments";
import { addMonths, parseDateInput, toCalendarInputValue } from "@/shared/utils/date";
import { formatBRL, parseBRLInput } from "@/shared/utils/money";

const initial: ActionState = { error: null };

export type DebtCreateMember = {
  userId: string;
  userName: string;
  userEmail?: string;
};

type PreviewRow = {
  number: number;
  amountInput: string;
  dueDate: string;
};

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function DebtCreateForm({
  workspaceId,
  members,
  currentUserId,
  defaultDueDate,
  shared,
}: {
  workspaceId: string;
  members: DebtCreateMember[];
  currentUserId: string;
  defaultDueDate: string;
  shared: boolean;
}) {
  const router = useRouter();
  const action = createDebtAction.bind(null, workspaceId);
  const [state, formAction, pending] = useActionState(action, initial);
  const [ownerId, setOwnerId] = useState(currentUserId);
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"setup" | "preview">("setup");
  const [localError, setLocalError] = useState<string | null>(null);
  const [navigating, setNavigating] = useState(false);

  const [kind, setKind] = useState<DebtKind>("INSTALLMENT");
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState("");
  const [firstDueDate, setFirstDueDate] = useState(defaultDueDate);
  const [autoPay, setAutoPay] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [recurringDay, setRecurringDay] = useState(
    () => String(Number(defaultDueDate.split("-")[2] ?? "10")),
  );
  const [preview, setPreview] = useState<PreviewRow[]>([]);

  const busy = pending || navigating;

  useEffect(() => {
    if (!state.ok || !state.debtId || navigating) {
      return;
    }

    setNavigating(true);
    router.push(`/w/${workspaceId}/debts/${state.debtId}`);
    router.refresh();
  }, [state.ok, state.debtId, navigating, router, workspaceId]);

  const previewTotalCents = useMemo(() => {
    return preview.reduce((sum, row) => {
      try {
        return sum + parseBRLInput(row.amountInput);
      } catch {
        return sum;
      }
    }, 0);
  }, [preview]);

  function buildPreview() {
    setLocalError(null);
    try {
      if (name.trim().length < 2) {
        setLocalError("Informe o nome da dívida");
        return;
      }

      if (kind === "RECURRING") {
        const amountCents = parseBRLInput(totalAmount);
        const day = Number(recurringDay);
        if (!Number.isInteger(day) || day < 1 || day > 31) {
          setLocalError("Dia do vencimento entre 1 e 31");
          return;
        }
        const due = parseDateInput(firstDueDate);
        setPreview([
          {
            number: 1,
            amountInput: centsToInput(amountCents),
            dueDate: toCalendarInputValue(due),
          },
        ]);
        setStep("preview");
        return;
      }

      const totalCents = parseBRLInput(totalAmount);
      const count = Number(installmentCount);
      if (!Number.isInteger(count) || count < 1 || count > 360) {
        setLocalError("Parcelas entre 1 e 360");
        return;
      }
      const due = parseDateInput(firstDueDate);
      const rows = generateInstallments(totalCents, count, due).map((item) => ({
        number: item.number,
        amountInput: centsToInput(item.amountCents),
        dueDate: toCalendarInputValue(item.dueDate),
      }));
      setPreview(rows);
      setStep("preview");
    } catch {
      setLocalError("Valor ou data inválidos");
    }
  }

  function updateAmount(index: number, value: string) {
    setPreview((rows) =>
      rows.map((row, i) => (i >= index ? { ...row, amountInput: value } : row)),
    );
  }

  function updateDueDate(index: number, value: string) {
    setPreview((rows) => {
      const next = rows.map((row, i) => (i === index ? { ...row, dueDate: value } : row));
      if (kind === "RECURRING") {
        return next;
      }
      try {
        const base = parseDateInput(value);
        for (let i = index + 1; i < next.length; i += 1) {
          next[i] = {
            ...next[i]!,
            dueDate: toCalendarInputValue(addMonths(base, i - index)),
          };
        }
      } catch {
        // deixa só a linha editada
      }
      return next;
    });
  }

  const amountsHidden = preview
    .map((row) => {
      try {
        return String(parseBRLInput(row.amountInput));
      } catch {
        return "0";
      }
    })
    .join(",");

  if (step === "preview") {
    return (
      <form action={formAction} className="space-y-4">
        <input name="kind" type="hidden" value={kind} />
        <input name="name" type="hidden" value={name} />
        <input name="installmentCount" type="hidden" value={String(preview.length)} />
        <input name="firstDueDate" type="hidden" value={preview[0]?.dueDate ?? firstDueDate} />
        <input name="ownerId" type="hidden" value={shared ? ownerId : currentUserId} />
        <input name="autoPay" type="hidden" value={autoPay ? "1" : "0"} />
        <input name="remindersEnabled" type="hidden" value={remindersEnabled ? "1" : "0"} />
        <input name="note" type="hidden" value={note} />
        <input name="installmentAmounts" type="hidden" value={amountsHidden} />
        <input name="installmentDueDates" type="hidden" value={preview.map((r) => r.dueDate).join(",")} />
        {kind === "RECURRING" ? (
          <>
            <input
              name="recurringAmount"
              type="hidden"
              value={preview[0]?.amountInput ?? totalAmount}
            />
            <input name="recurringDay" type="hidden" value={recurringDay} />
          </>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-ink/50">
              Preview · {kind === "RECURRING" ? "Recorrente" : "Parcelada"}
            </p>
            <h3 className="font-display text-2xl">{name}</h3>
            <p className="mt-1 text-sm text-ink/60">
              {kind === "RECURRING"
                ? "Primeira cobrança do mês. As próximas o cron cria automaticamente."
                : "Mudou valor ou data? As parcelas de baixo acompanham. O total vira a soma."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink/50">{kind === "RECURRING" ? "Mensal" : "Total"}</p>
            <p className="font-display text-2xl">{formatBRL(previewTotalCents)}</p>
          </div>
        </div>

        <ul className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-line bg-white/50 p-3">
          {preview.map((row, index) => (
            <li
              className="grid grid-cols-[auto_1fr_7rem] items-center gap-2 rounded-xl px-1 py-1.5 sm:grid-cols-[4rem_1fr_8rem]"
              key={row.number}
            >
              <span className="text-sm font-medium text-ink/70">#{row.number}</span>
              <input
                className="field py-2 text-sm"
                disabled={busy}
                onChange={(event) => updateDueDate(index, event.target.value)}
                type="date"
                value={row.dueDate}
              />
              <input
                className="field py-2 text-right text-sm"
                disabled={busy}
                onChange={(event) => updateAmount(index, event.target.value)}
                value={row.amountInput}
              />
            </li>
          ))}
        </ul>

        {(localError || state.error) ? <FormError message={localError ?? state.error!} /> : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="btn-ghost w-full"
            disabled={busy}
            onClick={() => setStep("setup")}
            type="button"
          >
            Voltar
          </button>
          <button className="btn-primary w-full" disabled={busy} type="submit">
            {navigating ? "Abrindo..." : pending ? "Salvando..." : "Confirmar e gerar"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          className={`rounded-2xl border px-3 py-3 text-left ${
            kind === "INSTALLMENT" ? "border-pine bg-pine-soft/50" : "border-line bg-white/60"
          }`}
          onClick={() => setKind("INSTALLMENT")}
          type="button"
        >
          <span className="block text-sm font-medium text-ink">Parcelada</span>
          <span className="mt-0.5 block text-xs text-ink/55">Financiamento, cartão, N vezes</span>
        </button>
        <button
          className={`rounded-2xl border px-3 py-3 text-left ${
            kind === "RECURRING" ? "border-pine bg-pine-soft/50" : "border-line bg-white/60"
          }`}
          onClick={() => setKind("RECURRING")}
          type="button"
        >
          <span className="block text-sm font-medium text-ink">Recorrente</span>
          <span className="mt-0.5 block text-xs text-ink/55">Plano de saúde, mensalidade</span>
        </button>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm text-ink/70">Nome</span>
        <input
          className="field"
          onChange={(event) => setName(event.target.value)}
          placeholder={kind === "RECURRING" ? "Plano de saúde, academia…" : "Cartão, financiamento, loja"}
          value={name}
        />
      </label>

      {kind === "INSTALLMENT" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm text-ink/70">Valor total</span>
            <input
              className="field"
              onChange={(event) => setTotalAmount(event.target.value)}
              placeholder="6425,00"
              value={totalAmount}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-ink/70">Parcelas</span>
            <input
              className="field"
              max={360}
              min={1}
              onChange={(event) => setInstallmentCount(event.target.value)}
              type="number"
              value={installmentCount}
            />
          </label>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm text-ink/70">Valor mensal</span>
            <input
              className="field"
              onChange={(event) => setTotalAmount(event.target.value)}
              placeholder="500,00"
              value={totalAmount}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-ink/70">Dia do vencimento</span>
            <input
              className="field"
              max={31}
              min={1}
              onChange={(event) => setRecurringDay(event.target.value)}
              type="number"
              value={recurringDay}
            />
          </label>
        </div>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm text-ink/70">
          {kind === "RECURRING" ? "Primeiro vencimento" : "Primeiro vencimento"}
        </span>
        <input
          className="field"
          onChange={(event) => setFirstDueDate(event.target.value)}
          type="date"
          value={firstDueDate}
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
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white/60 px-3 py-3">
        <input
          checked={autoPay}
          className="mt-1 size-4 accent-[var(--pine)]"
          onChange={(event) => setAutoPay(event.target.checked)}
          type="checkbox"
        />
        <span>
          <span className="block text-sm font-medium text-ink">Baixa automática</span>
          <span className="mt-0.5 block text-xs text-ink/55">
            No vencimento a parcela fica paga sozinha.
          </span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white/60 px-3 py-3">
        <input
          checked={remindersEnabled}
          className="mt-1 size-4 accent-[var(--pine)]"
          onChange={(event) => setRemindersEnabled(event.target.checked)}
          type="checkbox"
        />
        <span>
          <span className="block text-sm font-medium text-ink">Avisar por e-mail</span>
          <span className="mt-0.5 block text-xs text-ink/55">
            Antes do vencimento e se atrasar (admin precisa ligar o cron de e-mail).
          </span>
        </span>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm text-ink/70">Nota</span>
        <NoteEditor
          height={180}
          placeholder="O que combina lembrar: acordo, loja, por que parcelou..."
          value={note}
          onChange={setNote}
        />
      </label>
      <p className="text-xs text-ink/55">
        {kind === "RECURRING"
          ? "Todo mês o sistema cria a mesma cobrança até você pausar a recorrência."
          : "No próximo passo você vê as parcelas, ajusta valores e o total acompanha a soma."}
      </p>
      {(localError || state.error) ? <FormError message={localError ?? state.error!} /> : null}
      <button className="btn-primary w-full" onClick={buildPreview} type="button">
        {kind === "RECURRING" ? "Ver primeira cobrança" : "Ver parcelas"}
      </button>
    </div>
  );
}
