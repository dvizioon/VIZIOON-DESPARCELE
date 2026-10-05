"use client";

import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "@/components/ui/icon";
import { calendarDate } from "@/shared/utils/date";
import { formatBRL } from "@/shared/utils/money";
import type { InstallmentListItem } from "./types";
import { parseItemDate } from "./utils";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type DayCell = { year: number; month: number; day: number } | null;

function dayKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMonthCells(year: number, month: number): DayCell[] {
  const first = calendarDate(year, month, 1);
  const startPad = first.getUTCDay();
  const daysInMonth = calendarDate(year, month + 1, 0).getUTCDate();
  const cells: DayCell[] = [];

  for (let i = 0; i < startPad; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ year, month, day });
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells;
}

function shiftMonth(year: number, month: number, delta: number) {
  const cursor = calendarDate(year, month + delta, 1);
  return { year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() };
}

function isToday(year: number, month: number, day: number) {
  const now = new Date();
  return (
    now.getFullYear() === year && now.getMonth() === month && now.getDate() === day
  );
}

export function InstallmentsCalendar({
  items,
  highlightId,
}: {
  items: InstallmentListItem[];
  highlightId: string | null;
}) {
  const initial = useMemo(() => {
    const highlighted = items.find((item) => item.id === highlightId);
    const firstOpen = items.find((item) => !item.paid);
    const base = highlighted ?? firstOpen ?? items[0];
    if (!base) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() };
    }
    const due = parseItemDate(base.dueDate);
    return { year: due.getUTCFullYear(), month: due.getUTCMonth() };
  }, [items, highlightId]);

  const [view, setView] = useState(initial);
  const [selectedKey, setSelectedKey] = useState<string | null>(() => {
    const highlighted = items.find((item) => item.id === highlightId);
    if (!highlighted) {
      return null;
    }
    const due = parseItemDate(highlighted.dueDate);
    return dayKey(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  });

  // Mantém o mês alinhado quando chega parcela nova / highlight muda
  useEffect(() => {
    setView(initial);
    if (!highlightId) {
      return;
    }
    const highlighted = items.find((item) => item.id === highlightId);
    if (!highlighted) {
      return;
    }
    const due = parseItemDate(highlighted.dueDate);
    setSelectedKey(dayKey(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()));
  }, [initial.year, initial.month, highlightId, items, initial]);

  const byDay = useMemo(() => {
    const map = new Map<string, InstallmentListItem[]>();
    for (const item of items) {
      const due = parseItemDate(item.dueDate);
      const key = dayKey(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [items]);

  const cells = useMemo(
    () => buildMonthCells(view.year, view.month),
    [view.year, view.month],
  );

  const selectedItems = selectedKey ? (byDay.get(selectedKey) ?? []) : [];
  const monthLabel = `${MONTHS[view.month] ?? ""} ${view.year}`;

  return (
    <div className="sheet space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          aria-label="Mês anterior"
          className="rounded-xl px-3 py-2 text-sm text-ink/60 hover:bg-paper hover:text-ink"
          onClick={() => setView((current) => shiftMonth(current.year, current.month, -1))}
          type="button"
        >
          <AppIcon className="size-5" name="tabler:chevron-left" />
        </button>
        <p className="font-display text-2xl">{monthLabel}</p>
        <button
          aria-label="Próximo mês"
          className="rounded-xl px-3 py-2 text-sm text-ink/60 hover:bg-paper hover:text-ink"
          onClick={() => setView((current) => shiftMonth(current.year, current.month, 1))}
          type="button"
        >
          <AppIcon className="size-5" name="tabler:chevron-right" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((day) => (
          <span className="py-1 text-center text-[11px] font-medium text-ink/40" key={day}>
            {day}
          </span>
        ))}

        {cells.map((cell, index) => {
          if (!cell) {
            return <span key={`empty-${index}`} />;
          }

          const key = dayKey(cell.year, cell.month, cell.day);
          const dayItems = byDay.get(key) ?? [];
          const active = selectedKey === key;
          const today = isToday(cell.year, cell.month, cell.day);
          const hasPaid = dayItems.some((item) => item.paid);
          const hasOpen = dayItems.some((item) => !item.paid);
          const hasNew = dayItems.some((item) => item.id === highlightId);

          return (
            <button
              className={`min-h-[4.25rem] rounded-2xl border p-1.5 text-left transition ${
                active
                  ? "border-pine bg-pine text-white shadow-sm"
                  : today
                    ? "border-pine/35 bg-pine-soft/50 text-pine-dark hover:bg-pine-soft"
                    : dayItems.length > 0
                      ? "border-line bg-paper hover:border-pine/30 hover:bg-pine-soft/40"
                      : "border-transparent bg-white/50 text-ink/45 hover:bg-paper"
              }`}
              key={key}
              onClick={() => setSelectedKey(key)}
              type="button"
            >
              <span className={`text-sm font-medium ${active ? "text-white" : ""}`}>
                {cell.day}
              </span>
              {dayItems.length > 0 ? (
                <span className="mt-1 flex flex-wrap gap-0.5">
                  {hasOpen ? (
                    <span
                      className={`size-1.5 rounded-full ${active ? "bg-white/90" : "bg-clay"}`}
                    />
                  ) : null}
                  {hasPaid ? (
                    <span
                      className={`size-1.5 rounded-full ${active ? "bg-white/70" : "bg-moss"}`}
                    />
                  ) : null}
                  {hasNew ? (
                    <span
                      className={`size-1.5 rounded-full ${active ? "bg-white" : "bg-pine"}`}
                    />
                  ) : null}
                  {dayItems.length > 1 ? (
                    <span
                      className={`ml-0.5 text-[10px] leading-none ${
                        active ? "text-white/80" : "text-ink/45"
                      }`}
                    >
                      {dayItems.length}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-ink/50">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-clay" /> Aberta
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-moss" /> Paga
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-pine" /> Nova
        </span>
      </div>

      <div className="space-y-2 border-t border-line pt-3">
        {selectedKey == null ? (
          <p className="text-sm text-ink/55">Toque num dia para ver as parcelas.</p>
        ) : selectedItems.length === 0 ? (
          <p className="text-sm text-ink/55">Nenhuma parcela neste dia.</p>
        ) : (
          <ul className="grid gap-2">
            {selectedItems.map((item) => (
              <li
                className={`rounded-2xl border border-line bg-paper px-3 py-2.5 ${
                  item.id === highlightId ? "installment-blink ring-2 ring-pine/40" : ""
                }`}
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      <AppIcon
                        className={`size-4 ${item.paid ? "text-moss" : "text-clay"}`}
                        name={item.paid ? "tabler:circle-check" : "tabler:clock"}
                      />
                      Parcela {item.number}
                      {item.id === highlightId ? (
                        <span className="rounded-full bg-pine px-2 py-0.5 text-[11px] font-semibold text-white">
                          Nova
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-ink/55">
                      {item.paid ? "Paga" : "Em aberto"}
                    </p>
                  </div>
                  <p className="font-display text-xl">{formatBRL(item.amountCents)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
