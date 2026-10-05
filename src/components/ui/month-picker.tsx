"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Portal } from "@/components/ui/portal";

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

type MonthPickerProps = {
  /** Mês 0–11 */
  month: number;
  year: number;
  onChange: (next: { month: number; year: number }) => void;
  className?: string;
};

export function MonthPicker({ month, year, onChange, className = "" }: MonthPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(year);
  const [sheet, setSheet] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false,
  );
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  useEffect(() => {
    setViewYear(year);
  }, [year]);

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
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
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
    const width = Math.max(280, rect.width);
    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    const below = rect.bottom + 8;
    const top =
      below + 280 > window.innerHeight ? Math.max(12, rect.top - 288) : below;
    setMenuStyle({
      position: "fixed",
      top,
      left,
      width,
      zIndex: 80,
    });
  }, [open, sheet]);

  const label = `${MONTHS[month]} ${year}`;

  function pick(nextMonth: number) {
    onChange({ month: nextMonth, year: viewYear });
    setOpen(false);
  }

  const panel = (
    <div
      className={`rounded-2xl border border-line bg-paper p-3 shadow-lg ${
        sheet ? "mx-auto w-full max-w-sm" : ""
      }`}
      ref={menuRef}
      style={sheet ? undefined : menuStyle}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          className="rounded-xl px-2.5 py-1.5 text-sm text-ink/60 hover:bg-white hover:text-ink"
          onClick={() => setViewYear((y) => y - 1)}
          type="button"
        >
          Ant
        </button>
        <p className="text-sm font-medium">{viewYear}</p>
        <button
          className="rounded-xl px-2.5 py-1.5 text-sm text-ink/60 hover:bg-white hover:text-ink"
          onClick={() => setViewYear((y) => y + 1)}
          type="button"
        >
          Prox
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS.map((name, index) => {
          const active = index === month && viewYear === year;
          return (
            <button
              className={`rounded-xl px-2 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-pine text-white"
                  : "bg-white/70 text-ink/80 hover:bg-pine-soft hover:text-pine-dark"
              }`}
              key={name}
              onClick={() => pick(index)}
              type="button"
            >
              {name.slice(0, 3)}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        className="rounded-full border border-line bg-white/70 px-3 py-2 text-sm capitalize text-ink hover:border-pine/40"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {label}
      </button>
      {open ? (
        sheet ? (
          <Portal>
            <div className="fixed inset-0 z-[80] flex items-end bg-ink/30 p-3 sm:items-center sm:justify-center">
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
