"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  processLoanCronNowAction,
  retryCronTaskAction,
  setLoanCronEnabledAction,
  setLoanCronHourAction,
  setRecurringCronEnabledAction,
  setRecurringCronHourAction,
  setReminderCronEnabledAction,
  setReminderCronHourAction,
  setReminderDaysBeforeAction,
} from "@/app/actions/admin";
import { FormError } from "@/components/forms/auth-forms";
import type {
  CronTaskView,
  CronQueueSummary,
  SystemCronSettings,
} from "@/modules/cron/domain/loan-cron";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const DAYS = [1, 2, 3, 4, 5, 6, 7];

export function LoanCronSettings({
  settings,
  summary,
  tasks,
}: {
  settings: SystemCronSettings;
  summary: CronQueueSummary;
  tasks: CronTaskView[];
}) {
  const router = useRouter();
  const [loanEnabled, setLoanEnabled] = useState(settings.loan.enabled);
  const [loanHour, setLoanHour] = useState(settings.loan.hour);
  const [recurringEnabled, setRecurringEnabled] = useState(settings.recurring.enabled);
  const [recurringHour, setRecurringHour] = useState(settings.recurring.hour);
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminder.enabled);
  const [reminderHour, setReminderHour] = useState(settings.reminder.hour);
  const [daysBefore, setDaysBefore] = useState(settings.reminder.daysBefore);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ error: string | null; message?: string }>, onFail?: () => void) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        onFail?.();
        setError(result.error);
        return;
      }
      if (result.message) {
        setInfo(result.message);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <CronCard
        description={
          loanEnabled
            ? "Todo dia baixa parcelas vencidas de dívidas com baixa automática."
            : "Tarefas entram na fila, mas só rodam se ativar ou processar na mão."
        }
        enabled={loanEnabled}
        hour={loanHour}
        pending={pending}
        title="Baixa automática"
        onHour={(h) => {
          setLoanHour(h);
          run(() => setLoanCronHourAction(h), () => setLoanHour(settings.loan.hour));
        }}
        onToggle={(next) => {
          setLoanEnabled(next);
          run(() => setLoanCronEnabledAction(next), () => setLoanEnabled(!next));
        }}
      />

      <CronCard
        description={
          recurringEnabled
            ? "Gera a parcela do mês para dívidas recorrentes ativas."
            : "Geração mensal pausada no sistema."
        }
        enabled={recurringEnabled}
        hour={recurringHour}
        pending={pending}
        title="Recorrentes"
        onHour={(h) => {
          setRecurringHour(h);
          run(() => setRecurringCronHourAction(h), () => setRecurringHour(settings.recurring.hour));
        }}
        onToggle={(next) => {
          setRecurringEnabled(next);
          run(() => setRecurringCronEnabledAction(next), () => setRecurringEnabled(!next));
        }}
      />

      <div className="sheet space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-2xl">E-mails de parcela</h3>
              <StatusPill enabled={reminderEnabled} />
            </div>
            <p className="mt-2 max-w-md text-sm text-ink/60">
              {reminderEnabled
                ? "Avisa dono da dívida N dias antes e também se atrasar (mesmo com baixa automática)."
                : "Padrão desligado. Ligue aqui e ative o aviso em cada dívida."}
            </p>
          </div>
          <Toggle
            enabled={reminderEnabled}
            pending={pending}
            onToggle={(next) => {
              setReminderEnabled(next);
              run(() => setReminderCronEnabledAction(next), () => setReminderEnabled(!next));
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-ink/70">Dias antes do vencimento</span>
            <select
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
              disabled={pending}
              onChange={(e) => {
                const next = Number(e.target.value);
                setDaysBefore(next);
                run(
                  () => setReminderDaysBeforeAction(next),
                  () => setDaysBefore(settings.reminder.daysBefore),
                );
              }}
              value={daysBefore}
            >
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day} dia{day === 1 ? "" : "s"} antes
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-ink/70">Hora do dia (servidor)</span>
            <select
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
              disabled={pending}
              onChange={(e) => {
                const next = Number(e.target.value);
                setReminderHour(next);
                run(
                  () => setReminderCronHourAction(next),
                  () => setReminderHour(settings.reminder.hour),
                );
              }}
              value={reminderHour}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="sheet space-y-4">
        <div className="flex flex-wrap gap-2 text-xs text-ink/55">
          <span>{summary.pending} na fila</span>
          <span>·</span>
          <span>{summary.done} ok</span>
          <span>·</span>
          <span>{summary.failed} falhou</span>
        </div>
        <button
          className="btn-primary"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const result = await processLoanCronNowAction();
              return result;
            })
          }
          type="button"
        >
          Processar fila agora
        </button>
        {error ? <FormError message={error} /> : null}
        {info ? <p className="text-sm text-moss">{info}</p> : null}
      </div>

      <div className="sheet space-y-3">
        <h3 className="font-display text-2xl">Tarefas</h3>
        <p className="text-sm text-ink/60">
          Baixa automática, geração recorrente e e-mails na mesma fila.
        </p>
        {tasks.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhuma tarefa ainda.</p>
        ) : (
          <ul className="divide-y divide-line">
            {tasks.map((task) => (
              <li
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                key={task.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{task.runDate}</span>
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60">
                      {typeLabel(task.type)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(task.status)}`}>
                      {statusLabel(task.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink/60">
                    {task.message ?? task.error ?? `Agendada para ${formatWhen(task.scheduledFor)}`}
                  </p>
                </div>
                {(task.status === "FAILED" || task.status === "DONE") && (
                  <button
                    className="btn-ghost shrink-0"
                    disabled={pending}
                    onClick={() =>
                      run(async () => {
                        const result = await retryCronTaskAction(task.id);
                        return result;
                      })
                    }
                    type="button"
                  >
                    Rodar de novo
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CronCard({
  title,
  description,
  enabled,
  hour,
  pending,
  onToggle,
  onHour,
}: {
  title: string;
  description: string;
  enabled: boolean;
  hour: number;
  pending: boolean;
  onToggle: (next: boolean) => void;
  onHour: (hour: number) => void;
}) {
  return (
    <div className="sheet space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl">{title}</h3>
            <StatusPill enabled={enabled} />
          </div>
          <p className="mt-2 max-w-md text-sm text-ink/60">{description}</p>
        </div>
        <Toggle enabled={enabled} pending={pending} onToggle={onToggle} />
      </div>
      <label className="block max-w-xs">
        <span className="text-sm text-ink/70">Hora do dia (servidor)</span>
        <select
          className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
          disabled={pending}
          onChange={(e) => onHour(Number(e.target.value))}
          value={hour}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}:00
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function Toggle({
  enabled,
  pending,
  onToggle,
}: {
  enabled: boolean;
  pending: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      aria-pressed={enabled}
      className={`relative h-9 w-16 shrink-0 rounded-full transition ${
        enabled ? "bg-pine" : "bg-ink/20"
      } ${pending ? "opacity-60" : ""}`}
      disabled={pending}
      onClick={() => onToggle(!enabled)}
      type="button"
    >
      <span
        className={`absolute top-1 size-7 rounded-full bg-white shadow transition ${
          enabled ? "left-8" : "left-1"
        }`}
      />
      <span className="sr-only">{enabled ? "Desativar" : "Ativar"}</span>
    </button>
  );
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        enabled ? "bg-pine-soft text-pine-dark" : "bg-clay/10 text-clay"
      }`}
    >
      {enabled ? "Ativo" : "Desativado"}
    </span>
  );
}

function typeLabel(type: CronTaskView["type"]): string {
  if (type === "LOAN_AUTO_PAY") return "baixa auto";
  if (type === "RECURRING_GENERATE") return "recorrente/variável";
  return "e-mail";
}

function statusLabel(status: CronTaskView["status"]): string {
  if (status === "PENDING") return "na fila";
  if (status === "RUNNING") return "rodando";
  if (status === "DONE") return "ok";
  return "falhou";
}

function statusClass(status: CronTaskView["status"]): string {
  if (status === "PENDING") return "bg-ink/10 text-ink/70";
  if (status === "RUNNING") return "bg-pine-soft text-pine-dark";
  if (status === "DONE") return "bg-moss/15 text-moss";
  return "bg-clay/10 text-clay";
}

function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}
