"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createDebtAction } from "@/app/actions/debt";
import type { ActionState } from "@/app/actions/auth";
import { FormError } from "@/components/forms/auth-forms";
import {
  PreviewChargesList,
  newPreviewRowId,
  type PreviewChargeRow,
} from "@/components/forms/preview-charges-list";
import { NoteEditor } from "@/components/notes/note-editor";
import { DatePicker } from "@/components/ui/date-picker";
import { FancyCheckbox } from "@/components/ui/fancy-checkbox";
import { Tip } from "@/components/ui/tip";
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

type PreviewRow = PreviewChargeRow;

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
  const [installmentValue, setInstallmentValue] = useState("");
  const [installmentCount, setInstallmentCount] = useState("");
  const [alreadyPaidCount, setAlreadyPaidCount] = useState("0");
  const [firstDueDate, setFirstDueDate] = useState(defaultDueDate);
  /** total foi preenchido pela calculadora (parcela × qtd) */
  const [totalFromCalc, setTotalFromCalc] = useState(false);
  const [autoPay, setAutoPay] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [recurringDay, setRecurringDay] = useState(
    () => String(Number(defaultDueDate.split("-")[2] ?? "10")),
  );
  const [preview, setPreview] = useState<PreviewRow[]>([]);

  const busy = pending || navigating;
  const isMonthly = kind === "RECURRING" || kind === "VARIABLE";

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

  const previewOpenCents = useMemo(() => {
    return preview.reduce((sum, row) => {
      if (row.paid) {
        return sum;
      }
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

      if (isMonthly) {
        let amountCents = 0;
        if (totalAmount.trim() && totalAmount.trim() !== "0" && totalAmount.trim() !== "0,00") {
          amountCents = parseBRLInput(totalAmount);
        } else if (kind === "RECURRING") {
          setLocalError("Informe o valor mensal");
          return;
        } else {
          amountCents = 1; // variável sem estimativa: placeholder R$ 0,01
        }
        if (kind === "RECURRING" && amountCents < 100) {
          setLocalError("Valor mensal mínimo de R$ 1,00");
          return;
        }
        const day = Number(recurringDay);
        if (!Number.isInteger(day) || day < 1 || day > 31) {
          setLocalError("Dia do vencimento entre 1 e 31");
          return;
        }
        const paid = Number(alreadyPaidCount);
        if (!Number.isInteger(paid) || paid < 0 || paid > 120) {
          setLocalError("Já pagas entre 0 e 120");
          return;
        }
        const nextDue = parseDateInput(firstDueDate);
        const amountInput = centsToInput(Math.max(amountCents, 1));
        const rows: PreviewRow[] = [];
        for (let i = 0; i < paid; i += 1) {
          rows.push({
            id: newPreviewRowId(),
            number: i + 1,
            amountInput,
            dueDate: toCalendarInputValue(addMonths(nextDue, -(paid - i))),
            paid: true,
          });
        }
        rows.push({
          id: newPreviewRowId(),
          number: paid + 1,
          amountInput,
          dueDate: toCalendarInputValue(nextDue),
          paid: false,
        });

        // Se o próximo ficou no passado, abre cobranças até o mês atual
        const now = new Date();
        const currentKey = now.getFullYear() * 12 + now.getMonth();
        while (rows.length < 121) {
          const last = rows[rows.length - 1]!;
          const lastDue = parseDateInput(last.dueDate);
          const lastKey = lastDue.getUTCFullYear() * 12 + lastDue.getUTCMonth();
          if (lastKey >= currentKey) {
            break;
          }
          rows.push({
            id: newPreviewRowId(),
            number: rows.length + 1,
            amountInput,
            dueDate: toCalendarInputValue(addMonths(lastDue, 1)),
            paid: false,
          });
        }

        setPreview(rows);
        setStep("preview");
        return;
      }

      const count = Number(installmentCount);
      if (!Number.isInteger(count) || count < 1 || count > 360) {
        setLocalError("Parcelas entre 1 e 360");
        return;
      }

      let totalCents = 0;
      let perCents: number | null = null;
      try {
        if (installmentValue.trim()) {
          perCents = parseBRLInput(installmentValue);
        }
      } catch {
        setLocalError("Valor da parcela inválido");
        return;
      }
      try {
        if (totalAmount.trim() && totalAmount.trim() !== "0" && totalAmount.trim() !== "0,00") {
          totalCents = parseBRLInput(totalAmount);
        }
      } catch {
        setLocalError("Valor total inválido");
        return;
      }

      // Não sabe o total: qtd × valor da parcela
      let equalParcels = false;
      if (totalCents < 1 && perCents != null && perCents >= 1) {
        totalCents = perCents * count;
        setTotalAmount(centsToInput(totalCents));
        setTotalFromCalc(true);
        equalParcels = true;
      } else if (
        perCents != null &&
        perCents >= 1 &&
        (totalFromCalc || totalCents === perCents * count)
      ) {
        equalParcels = true;
      }

      if (totalCents < 100) {
        setLocalError("Informe o total ou o valor de cada parcela");
        return;
      }

      const due = parseDateInput(firstDueDate);
      const rows = equalParcels
        ? Array.from({ length: count }, (_, index) => ({
            id: newPreviewRowId(),
            number: index + 1,
            amountInput: centsToInput(perCents!),
            dueDate: toCalendarInputValue(addMonths(due, index)),
            paid: false,
          }))
        : generateInstallments(totalCents, count, due).map((item) => ({
            id: newPreviewRowId(),
            number: item.number,
            amountInput: centsToInput(item.amountCents),
            dueDate: toCalendarInputValue(item.dueDate),
            paid: false,
          }));
      setPreview(rows);
      setStep("preview");
    } catch {
      setLocalError("Valor ou data inválidos");
    }
  }

  function syncTotalFromParcel(nextParcel: string, nextCount: string) {
    setInstallmentValue(nextParcel);
    try {
      const count = Number(nextCount);
      if (!Number.isInteger(count) || count < 1) {
        return;
      }
      if (!nextParcel.trim()) {
        return;
      }
      const per = parseBRLInput(nextParcel);
      if (per < 1) {
        return;
      }
      setTotalAmount(centsToInput(per * count));
      setTotalFromCalc(true);
    } catch {
      // digitando
    }
  }

  function syncParcelFromTotal(nextTotal: string, nextCount: string) {
    setTotalAmount(nextTotal);
    setTotalFromCalc(false);
    try {
      const count = Number(nextCount);
      if (!Number.isInteger(count) || count < 1) {
        return;
      }
      if (!nextTotal.trim() || nextTotal.trim() === "0") {
        return;
      }
      const total = parseBRLInput(nextTotal);
      if (total < 1) {
        return;
      }
      setInstallmentValue(centsToInput(Math.floor(total / count)));
    } catch {
      // digitando
    }
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

  const paidHidden = preview.map((row) => (row.paid ? "1" : "0")).join(",");
  const nextOpenDue =
    preview.find((row) => !row.paid)?.dueDate ?? preview[0]?.dueDate ?? firstDueDate;

  if (step === "preview") {
    return (
      <form action={formAction} className="space-y-4">
        <input name="kind" type="hidden" value={kind} />
        <input name="name" type="hidden" value={name} />
        <input name="installmentCount" type="hidden" value={String(preview.length)} />
        <input name="firstDueDate" type="hidden" value={nextOpenDue} />
        <input name="ownerId" type="hidden" value={shared ? ownerId : currentUserId} />
        <input name="autoPay" type="hidden" value={autoPay ? "1" : "0"} />
        <input name="remindersEnabled" type="hidden" value={remindersEnabled ? "1" : "0"} />
        <input name="note" type="hidden" value={note} />
        <input name="installmentAmounts" type="hidden" value={amountsHidden} />
        <input name="installmentDueDates" type="hidden" value={preview.map((r) => r.dueDate).join(",")} />
        <input name="installmentPaidFlags" type="hidden" value={paidHidden} />
        {isMonthly ? (
          <>
            <input
              name="recurringAmount"
              type="hidden"
              value={
                kind === "VARIABLE"
                  ? totalAmount.trim() && totalAmount !== "0" && totalAmount !== "0,00"
                    ? totalAmount
                    : "0"
                  : (preview.find((row) => !row.paid)?.amountInput ?? totalAmount)
              }
            />
            <input name="recurringDay" type="hidden" value={recurringDay} />
            <input
              name="alreadyPaidCount"
              type="hidden"
              value={String(preview.filter((row) => row.paid).length)}
            />
          </>
        ) : null}

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-ink/50">
              {kind === "RECURRING"
                ? "Recorrente"
                : kind === "VARIABLE"
                  ? "Mensal variável"
                  : "Parcelada"}
            </p>
            <h3 className="font-display text-2xl">{name}</h3>
          </div>
          <div className="text-right">
            <p className="text-sm text-ink/50">{isMonthly ? "Em aberto" : "Total"}</p>
            <p className="font-display text-2xl">
              {formatBRL(isMonthly ? previewOpenCents : previewTotalCents)}
            </p>
            {isMonthly && preview.some((row) => row.paid) ? (
              <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
                <span className="rounded-full bg-line/50 px-2 py-0.5 text-[11px] text-ink/60">
                  {preview.filter((row) => row.paid).length} pagas
                </span>
                <span className="rounded-full bg-line/50 px-2 py-0.5 text-[11px] text-ink/60">
                  {formatBRL(previewTotalCents)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <PreviewChargesList
          addBeforeAsPaid={isMonthly}
          cascadeOnDateEdit={!isMonthly}
          disabled={busy}
          onChange={setPreview}
          rows={preview}
        />

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
      <div className="grid gap-2 sm:grid-cols-3">
        <button
          className={`rounded-2xl border px-3 py-3 text-left ${
            kind === "INSTALLMENT" ? "border-pine bg-pine-soft/50" : "border-line bg-white/60"
          }`}
          onClick={() => setKind("INSTALLMENT")}
          type="button"
        >
          <span className="block text-sm font-medium text-ink">Parcelada</span>
          <span className="mt-0.5 block text-xs text-ink/55">N vezes, valor definido</span>
        </button>
        <button
          className={`rounded-2xl border px-3 py-3 text-left ${
            kind === "RECURRING" ? "border-pine bg-pine-soft/50" : "border-line bg-white/60"
          }`}
          onClick={() => setKind("RECURRING")}
          type="button"
        >
          <span className="block text-sm font-medium text-ink">Recorrente</span>
          <span className="mt-0.5 block text-xs text-ink/55">Mesmo valor todo mês</span>
        </button>
        <button
          className={`rounded-2xl border px-3 py-3 text-left ${
            kind === "VARIABLE" ? "border-pine bg-pine-soft/50" : "border-line bg-white/60"
          }`}
          onClick={() => setKind("VARIABLE")}
          type="button"
        >
          <span className="block text-sm font-medium text-ink">Mensal variável</span>
          <span className="mt-0.5 block text-xs text-ink/55">Caixa, cartão, valor muda</span>
        </button>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm text-ink/70">Nome</span>
        <input
          className="field"
          onChange={(event) => setName(event.target.value)}
          placeholder={
            kind === "VARIABLE"
              ? "Caixa, cartão…"
              : kind === "RECURRING"
                ? "Plano de saúde, academia…"
                : "Financiamento, loja"
          }
          value={name}
        />
      </label>

      {kind === "INSTALLMENT" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm text-ink/70">Parcelas</span>
              <input
                className="field"
                max={360}
                min={1}
                onChange={(event) => {
                  const next = event.target.value;
                  setInstallmentCount(next);
                  if (installmentValue.trim()) {
                    syncTotalFromParcel(installmentValue, next);
                  } else if (totalAmount.trim()) {
                    syncParcelFromTotal(totalAmount, next);
                  }
                }}
                type="number"
                value={installmentCount}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm text-ink/70">Valor da parcela</span>
              <input
                className="field"
                onChange={(event) => syncTotalFromParcel(event.target.value, installmentCount)}
                placeholder="535,42"
                value={installmentValue}
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-sm text-ink/70">
              Valor total{totalFromCalc ? " (calculado)" : ""}
              <Tip content="Pode deixar 0. Informe parcelas e o valor de cada uma. O total é calculado." />
            </span>
            <input
              className="field"
              onChange={(event) => syncParcelFromTotal(event.target.value, installmentCount)}
              placeholder="0 ou 6425,00"
              value={totalAmount}
            />
          </label>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-sm text-ink/70">
              {kind === "VARIABLE" ? "Estimativa (opcional)" : "Valor da parcela"}
              {kind === "VARIABLE" ? (
                <Tip content="Sugestão inicial. Nos meses seguintes usa a última cobrança. Você pode ajustar." />
              ) : null}
            </span>
            <input
              className="field"
              onChange={(event) => setTotalAmount(event.target.value)}
              placeholder={kind === "VARIABLE" ? "750,00 ou 0" : "500,00"}
              value={totalAmount}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-sm text-ink/70">
              Já pagas
              <Tip content="Quantas cobranças já passaram. Elas entram como pagas e a próxima fica aberta." />
            </span>
            <input
              className="field"
              max={120}
              min={0}
              onChange={(event) => setAlreadyPaidCount(event.target.value)}
              type="number"
              value={alreadyPaidCount}
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
          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-sm text-ink/70">
              Próximo vencimento
              <Tip content="Data da próxima cobrança em aberto. Se ficar no passado, a lista abre os meses até hoje." />
            </span>
            <DatePicker onChange={setFirstDueDate} value={firstDueDate} />
          </label>
        </div>
      )}

      {kind === "INSTALLMENT" ? (
        <label className="block space-y-1.5">
          <span className="text-sm text-ink/70">Primeiro vencimento</span>
          <DatePicker onChange={setFirstDueDate} value={firstDueDate} />
        </label>
      ) : null}

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

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <FancyCheckbox
          checked={autoPay}
          label="Baixa automática"
          onChange={setAutoPay}
          tip="Empréstimo ou débito. Desligado por padrão. Mensal: parcela do cron já nasce paga. Parcelada: baixa no vencimento."
        />
        <FancyCheckbox
          checked={remindersEnabled}
          label="Avisar por e-mail"
          onChange={setRemindersEnabled}
          tip="Avisa antes do vencimento e se atrasar."
        />
      </div>

      <label className="block space-y-1.5">
        <span className="flex items-center gap-1.5 text-sm text-ink/70">
          Nota
          <Tip
            content={
              kind === "VARIABLE"
                ? "Ideal pra Caixa ou cartão: todo mês abre uma cobrança; você coloca o valor real e paga."
                : kind === "RECURRING"
                  ? "Se já pagou algumas, informe em Já pagas. Elas entram nos meses anteriores e a próxima fica aberta."
                  : "No próximo passo você vê as parcelas e ajusta valores. O total acompanha a soma."
            }
          />
        </span>
        <NoteEditor
          height={180}
          placeholder="O que combina lembrar: acordo, loja, por que parcelou..."
          value={note}
          onChange={setNote}
        />
      </label>
      {(localError || state.error) ? <FormError message={localError ?? state.error!} /> : null}
      <button className="btn-primary w-full" onClick={buildPreview} type="button">
        {isMonthly ? "Ver cobranças" : "Ver parcelas"}
      </button>
    </div>
  );
}
