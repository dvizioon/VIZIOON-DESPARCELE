"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  processLoanCronNowAction,
  retryCronTaskAction,
  setLoanCronEnabledAction,
  setLoanCronHourAction,
} from "@/app/actions/admin";
import { FormError } from "@/components/forms/auth-forms";
import type { CronTaskView, LoanCronSettings, CronQueueSummary } from "@/modules/cron/domain/loan-cron";

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export function LoanCronSettings({
  settings,
  summary,
  tasks,
}: {
  settings: LoanCronSettings;
  summary: CronQueueSummary;
  tasks: CronTaskView[];
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [hour, setHour] = useState(settings.hour);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setError(null);
    setInfo(null);
    setEnabled(next);
    startTransition(async () => {
      const result = await setLoanCronEnabledAction(next);
      if (result.error) {
        setEnabled(!next);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function saveHour(next: number) {
    setError(null);
    setInfo(null);
    setHour(next);
    startTransition(async () => {
      const result = await setLoanCronHourAction(next);
      if (result.error) {
        setHour(settings.hour);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function runNow() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await processLoanCronNowAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      setInfo(
        result.message ??
          "Fila processada.",
      );
      router.refresh();
    });
  }

  function retry(id: string) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const result = await retryCronTaskAction(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setInfo(result.message ?? "Tarefa reprocessada.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="sheet space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-2xl">Cron de empréstimo</h3>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  enabled ? "bg-pine-soft text-pine-dark" : "bg-clay/10 text-clay"
                }`}
              >
                {enabled ? "Ativo" : "Desativado"}
              </span>
            </div>
            <p className="mt-2 max-w-md text-sm text-ink/60">
              {enabled
                ? "Todo dia na hora abaixo entra uma tarefa e a fila é processada."
                : "As tarefas do dia ainda entram na fila, mas não rodam até você ativar ou processar na mão."}
            </p>
          </div>

          <button
            aria-pressed={enabled}
            className={`relative h-9 w-16 shrink-0 rounded-full transition ${
              enabled ? "bg-pine" : "bg-ink/20"
            } ${pending ? "opacity-60" : ""}`}
            disabled={pending}
            onClick={() => toggle(!enabled)}
            type="button"
          >
            <span
              className={`absolute top-1 size-7 rounded-full bg-white shadow transition ${
                enabled ? "left-8" : "left-1"
              }`}
            />
            <span className="sr-only">{enabled ? "Desativar cron" : "Ativar cron"}</span>
          </button>
        </div>

        <label className="block max-w-xs">
          <span className="text-sm text-ink/70">Hora do dia (servidor)</span>
          <select
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm"
            disabled={pending}
            onChange={(e) => saveHour(Number(e.target.value))}
            value={hour}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2 text-xs text-ink/55">
          <span>{summary.pending} na fila</span>
          <span>·</span>
          <span>{summary.done} ok</span>
          <span>·</span>
          <span>{summary.failed} falhou</span>
        </div>

        <button className="btn-primary" disabled={pending} onClick={runNow} type="button">
          Processar fila agora
        </button>

        {error ? <FormError message={error} /> : null}
        {info ? <p className="text-sm text-moss">{info}</p> : null}
      </div>

      <div className="sheet space-y-3">
        <h3 className="font-display text-2xl">Tarefas</h3>
        <p className="text-sm text-ink/60">
          Se o cron estiver desligado ou o app cair, os dias acumulam aqui até alguém processar.
        </p>

        {tasks.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhuma tarefa ainda.</p>
        ) : (
          <ul className="divide-y divide-line">
            {tasks.map((task) => (
              <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between" key={task.id}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{task.runDate}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(task.status)}`}>
                      {statusLabel(task.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink/60">
                    {task.message ??
                      task.error ??
                      `Agendada para ${formatWhen(task.scheduledFor)}`}
                    {task.paidCount != null && task.status === "DONE"
                      ? ` · ${task.paidCount} parcela(s)`
                      : null}
                  </p>
                </div>
                {(task.status === "FAILED" || task.status === "DONE") && (
                  <button
                    className="btn-ghost shrink-0"
                    disabled={pending}
                    onClick={() => retry(task.id)}
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
