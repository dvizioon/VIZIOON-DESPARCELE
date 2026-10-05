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

type PanelMode = "day" | "month" | "year";

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
  const [mode, setMode] = useState<PanelMode>("day");
  const [draft, setDraft] = useState(() => toDisplay(value));
  const [view, setView] = useState(() => viewFromValue(value));
  const [sheet, setSheet] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false,
  );
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useEffect(() => {
    setDraft(toDisplay(value));
    if (!open) {
      setView(viewFromValue(value));
    }
  }, [value, open]);

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
        if (mode !== "day") {
          setMode("day");
          return;
        }
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
    const timer = window.setTimeout(() => {
      window.addEventListener("mousedown", onPointer);
    }, 0);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open, mode]);

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
    const top = below + 380 > window.innerHeight ? Math.max(12, rect.top - 388) : below;
    setMenuStyle({
      position: "fixed",
      top,
      left,
      width,
      zIndex: 90,
    });
  }, [open, sheet, mode]);

  const cells = useMemo(() => buildCalendar(view.year, view.month), [view.year, view.month]);
  const years = useMemo(() => {
    const start = view.year - 6;
    return Array.from({ length: 12 }, (_, index) => start + index);
  }, [view.year]);
  const selected = safeParse(value);
  const label = selected ? formatDateFull(selected) : "Data";

  function openPicker() {
    if (disabled) {
      return;
    }
    setView(viewFromValue(value));
    setDraft(toDisplay(value));
    setMode("day");
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 40);
  }

  function commitIso(iso: string, close = true) {
    onChange(iso);
    setDraft(toDisplay(iso));
    setView(viewFromValue(iso));
    if (close) {
      setMode("day");
      setOpen(false);
    }
  }

  function pickDay(year: number, month: number, day: number) {
    commitIso(toCalendarInputValue(calendarDate(year, month, day)), true);
  }

  function syncDraft(close = false) {
    const parsed = parseTypedDate(draft);
    if (!parsed) {
      setDraft(toDisplay(value));
      return;
    }
    commitIso(toCalendarInputValue(parsed), close);
  }

  function shiftView(delta: number) {
    if (mode === "year") {
      setView((current) => ({ ...current, year: current.year + delta * 12 }));
      return;
    }
    if (mode === "month") {
      setView((current) => ({ ...current, year: current.year + delta }));
      return;
    }
    setView((current) => shiftMonth(current, delta));
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

      <div className="mb-2 flex items-center justify-between gap-1">
        <button
          className="rounded-xl px-2 py-1.5 text-sm text-ink/60 hover:bg-white hover:text-ink"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => shiftView(-1)}
          type="button"
        >
          Ant
        </button>
        <div className="flex min-w-0 items-center gap-1">
          <button
            className="rounded-xl px-2 py-1.5 text-sm font-medium text-ink hover:bg-white"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setMode((current) => (current === "month" ? "day" : "month"))}
            type="button"
          >
            {(MONTHS[view.month] ?? "").slice(0, 3)}
          </button>
          <button
            className="rounded-xl px-2 py-1.5 text-sm font-medium text-ink hover:bg-white"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setMode((current) => (current === "year" ? "day" : "year"))}
            type="button"
          >
            {view.year}
          </button>
        </div>
        <button
          className="rounded-xl px-2 py-1.5 text-sm text-ink/60 hover:bg-white hover:text-ink"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => shiftView(1)}
          type="button"
        >
          Prox
        </button>
      </div>

      {mode === "month" ? (
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map((name, index) => {
            const active = index === view.month;
            return (
              <button
                className={`rounded-xl px-2 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-pine text-white"
                    : "bg-white/70 text-ink/80 hover:bg-pine-soft hover:text-pine-dark"
                }`}
                key={name}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setView((current) => ({ ...current, month: index }));
                  setMode("day");
                }}
                type="button"
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>
      ) : null}

      {mode === "year" ? (
        <div className="grid grid-cols-3 gap-1.5">
          {years.map((year) => {
            const active = year === view.year;
            return (
              <button
                className={`rounded-xl px-2 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-pine text-white"
                    : "bg-white/70 text-ink/80 hover:bg-pine-soft hover:text-pine-dark"
                }`}
                key={year}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setView((current) => ({ ...current, year }));
                  setMode("month");
                }}
                type="button"
              >
                {year}
              </button>
            );
          })}
        </div>
      ) : null}

      {mode === "day" ? (
        <>
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
                        ? "ring-1 ring-pine/40 text-pine-dark hover:bg-pine-soft"
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
        </>
      ) : null}

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
        <button
          className="text-ink/45 hover:text-ink"
          onClick={() => {
            setMode("day");
            setOpen(false);
          }}
          type="button"
        >
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
          if (open) {
            setOpen(false);
            setMode("day");
            return;
          }
          openPicker();
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
                onClick={() => {
                  setMode("day");
                  setOpen(false);
                }}
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
