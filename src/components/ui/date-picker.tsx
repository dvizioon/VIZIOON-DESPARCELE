"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Portal } from "@/components/ui/portal";
import {
  calendarDate,
  formatDateFull,
  parseDateInput,
  toCalendarInputValue,
} from "@/shared/utils/date";

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

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

type DatePickerProps = {
  /** YYYY-MM-DD */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  name?: string;
  id?: string;
};

export function DatePicker({
  value,
  onChange,
  disabled = false,
  className = "",
  compact = false,
  name,
  id,
}: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => toDisplay(value));
  const [view, setView] = useState(() => viewFromValue(value));
  const [sheet, setSheet] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false,
  );
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useEffect(() => {
    setDraft(toDisplay(value));
    setView(viewFromValue(value));
  }, [value]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setSheet(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    function onPointer(event: MouseEvent) {
      const path = event.composedPath();
      for (const node of path) {
        if (!(node instanceof HTMLElement)) {
          continue;
        }
        if (node.dataset.datePicker === "root" || node.dataset.datePicker === "panel") {
          return;
        }
      }
      setOpen(false);
    }
    // Evita o mesmo clique que abriu já fechar o painel
    const timer = window.setTimeout(() => {
      window.addEventListener("mousedown", onPointer);
    }, 0);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || sheet) {
      return;
    }
    const el = rootRef.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const width = Math.max(300, rect.width);
    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    const below = rect.bottom + 8;
    const top = below + 360 > window.innerHeight ? Math.max(12, rect.top - 368) : below;
    setMenuStyle({
      position: "fixed",
      top,
      left,
      width,
      zIndex: 90,
    });
  }, [open, sheet]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  const cells = useMemo(() => buildCalendar(view.year, view.month), [view.year, view.month]);
  const selected = safeParse(value);
  const label = selected ? formatDateFull(selected) : "Data";

  function commitIso(iso: string, close = true) {
    onChange(iso);
    setDraft(toDisplay(iso));
    setView(viewFromValue(iso));
    if (close) {
      setOpen(false);
    }
  }

  function pickDay(year: number, month: number, day: number) {
    commitIso(toCalendarInputValue(calendarDate(year, month, day)), true);
  }

  /** Valida o que digitou sem fechar o calendário (blur / Ant / Prox). */
  function syncDraft(close = false) {
    const parsed = parseTypedDate(draft);
    if (!parsed) {
      setDraft(toDisplay(value));
      return;
    }
    commitIso(toCalendarInputValue(parsed), close);
  }

  const panel = (
    <div
      className={`rounded-2xl border border-line bg-paper p-3 shadow-lg ${
        sheet ? "mx-auto w-full max-w-sm" : ""
      }`}
      data-date-picker="panel"
      ref={menuRef}
      style={sheet ? undefined : menuStyle}
    >
      <input
        aria-label="Data"
        className="field mb-3 w-full rounded-xl px-3 py-2 text-sm"
        inputMode="numeric"
        onBlur={() => syncDraft(false)}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            syncDraft(true);
          }
        }}
        placeholder="dd/mm/aaaa"
        ref={inputRef}
        value={draft}
      />

      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          className="rounded-xl px-2.5 py-1.5 text-sm text-ink/60 hover:bg-white hover:text-ink"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setView((current) => shiftMonth(current, -1))}
          type="button"
        >
          Ant
        </button>
        <p className="text-sm font-medium text-ink">
          {MONTHS[view.month]} {view.year}
        </p>
        <button
          className="rounded-xl px-2.5 py-1.5 text-sm text-ink/60 hover:bg-white hover:text-ink"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setView((current) => shiftMonth(current, 1))}
          type="button"
        >
          Prox
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, index) => (
          <span className="py-1 text-center text-[11px] text-ink/40" key={`${day}-${index}`}>
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ cell, index }) => {
          if (!cell) {
            return <span key={`empty-${index}`} />;
          }
          const active =
            selected != null &&
            selected.getUTCFullYear() === cell.year &&
            selected.getUTCMonth() === cell.month &&
            selected.getUTCDate() === cell.day;
          const today = isToday(cell.year, cell.month, cell.day);
          return (
            <button
              className={`aspect-square rounded-xl text-sm transition-colors ${
                active
                  ? "bg-pine font-semibold text-white"
                  : today
                    ? "bg-pine-soft/80 text-pine-dark hover:bg-pine-soft"
                    : "bg-white/70 text-ink/80 hover:bg-pine-soft hover:text-pine-dark"
              }`}
              key={`${cell.year}-${cell.month}-${cell.day}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pickDay(cell.year, cell.month, cell.day)}
              type="button"
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-sm">
        <button
          className="text-pine-dark hover:underline"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const now = new Date();
            pickDay(now.getFullYear(), now.getMonth(), now.getDate());
          }}
          type="button"
        >
          Hoje
        </button>
        <button className="text-ink/45 hover:text-ink" onClick={() => setOpen(false)} type="button">
          Fechar
        </button>
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`} data-date-picker="root" id={id} ref={rootRef}>
      {name ? <input name={name} type="hidden" value={value} /> : null}
      <button
        className={
          compact
            ? "field w-full py-2 pl-3 pr-3 text-left text-sm capitalize"
            : "field w-full text-left capitalize"
        }
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
        type="button"
      >
        {label}
      </button>
      {open ? (
        sheet ? (
          <Portal>
            <div className="fixed inset-0 z-[90] flex items-end bg-ink/30 p-3 sm:items-center sm:justify-center">
              <button
                aria-label="Fechar"
                className="absolute inset-0 cursor-default"
                onClick={() => setOpen(false)}
                type="button"
              />
              <div className="relative z-10 w-full">{panel}</div>
            </div>
          </Portal>
        ) : (
          <Portal>{panel}</Portal>
        )
      ) : null}
    </div>
  );
}

function safeParse(value: string): Date | null {
  try {
    if (!value) {
      return null;
    }
    return parseDateInput(value);
  } catch {
    return null;
  }
}

function toDisplay(value: string): string {
  const date = safeParse(value);
  if (!date) {
    return "";
  }
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

function viewFromValue(value: string): { year: number; month: number } {
  const parsed = safeParse(value);
  if (parsed) {
    return { year: parsed.getUTCFullYear(), month: parsed.getUTCMonth() };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function shiftMonth(view: { year: number; month: number }, delta: number) {
  const cursor = calendarDate(view.year, view.month + delta, 1);
  return { year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() };
}

function buildCalendar(year: number, month: number) {
  const first = calendarDate(year, month, 1);
  const weekday = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<{ year: number; month: number; day: number } | null> = [];

  for (let i = 0; i < weekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ year, month, day });
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  return cells.map((cell, index) => ({ cell, index }));
}

function isToday(year: number, month: number, day: number) {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

function parseTypedDate(raw: string): Date | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    try {
      return parseDateInput(value);
    } catch {
      return null;
    }
  }

  const match = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) {
    year += year >= 70 ? 1900 : 2000;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = calendarDate(year, month - 1, day);
  if (date.getUTCDate() !== day || date.getUTCMonth() !== month - 1) {
    return null;
  }
  return date;
}
