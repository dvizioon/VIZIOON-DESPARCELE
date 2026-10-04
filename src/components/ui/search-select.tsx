"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { AppIcon } from "@/components/ui/icon";
import { Portal } from "@/components/ui/portal";

export type SearchSelectOption = {
  value: string;
  label: string;
  hint?: string;
};

type SearchSelectProps = {
  name?: string;
  value: string;
  options: SearchSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  disabled?: boolean;
  onChange?: (value: string) => void;
};

export function SearchSelect({
  name,
  value,
  options,
  placeholder = "Escolher",
  searchPlaceholder = "Buscar",
  pageSize = 6,
  disabled = false,
  onChange,
}: SearchSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sheet, setSheet] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 639px)").matches : false,
  );
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return options;
    }

    return options.filter((option) => {
      return (
        option.label.toLowerCase().includes(term) ||
        (option.hint ?? "").toLowerCase().includes(term)
      );
    });
  }, [options, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  useEffect(() => {
    setPage(0);
  }, [query]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setSheet(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    if (!open || sheet) {
      return;
    }

    function place() {
      const trigger = rootRef.current;
      if (!trigger) {
        return;
      }

      const box = trigger.getBoundingClientRect();
      const gap = 8;
      const maxHeight = Math.min(320, window.innerHeight - box.bottom - gap - 16);
      setMenuStyle({
        position: "fixed",
        top: box.bottom + gap,
        left: box.left,
        width: box.width,
        maxHeight: Math.max(180, maxHeight),
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, sheet]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const list = (
    <>
      <div className="border-b border-line p-2">
        <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5">
          <AppIcon name="tabler:search" className="size-4 shrink-0 text-ink/40" />
          <input
            className="w-full min-w-0 bg-transparent text-base outline-none sm:text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            value={query}
          />
        </label>
      </div>
      <ul className="max-h-[50vh] overflow-y-auto p-1 sm:max-h-64">
        {visible.length === 0 ? (
          <li className="px-3 py-3 text-sm text-ink/50">Nada encontrado</li>
        ) : (
          visible.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value}>
                <button
                  className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition sm:min-h-0 sm:py-2 ${
                    active ? "bg-pine-soft text-pine-dark" : "hover:bg-white"
                  }`}
                  onClick={() => {
                    onChange?.(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{option.label}</span>
                    {option.hint ? (
                      <span className="mt-0.5 block truncate text-xs text-ink/45">{option.hint}</span>
                    ) : null}
                  </span>
                  {active ? <AppIcon name="tabler:check" className="size-4 shrink-0" /> : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
      {filtered.length > pageSize ? (
        <div className="flex items-center justify-between border-t border-line px-3 py-2 text-xs text-ink/55">
          <button
            className="min-h-10 rounded-full px-3 py-1 hover:bg-white disabled:opacity-40"
            disabled={safePage === 0}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            type="button"
          >
            Anterior
          </button>
          <span>
            {safePage + 1} de {pageCount}
          </span>
          <button
            className="min-h-10 rounded-full px-3 py-1 hover:bg-white disabled:opacity-40"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
            type="button"
          >
            Próxima
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="relative w-full min-w-0" ref={rootRef}>
      {name ? <input name={name} type="hidden" value={value} /> : null}
      <button
        className="field flex min-h-12 items-center justify-between gap-2 text-left sm:min-h-0"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className={`min-w-0 truncate ${selected ? "text-ink" : "text-ink/45"}`}>
          {selected?.label ?? placeholder}
        </span>
        <AppIcon name={open ? "tabler:chevron-up" : "tabler:chevron-down"} className="size-4 shrink-0 text-ink/45" />
      </button>

      {open ? (
        <Portal>
          {sheet ? (
            <div className="fixed inset-0 z-[80] flex items-end justify-center sm:hidden">
              <div className="absolute inset-0 bg-ink/45" onClick={() => setOpen(false)} />
              <div
                className="relative z-10 w-full rounded-t-3xl border border-line bg-card p-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-sheet"
                ref={menuRef}
              >
                <div className="flex justify-center py-2">
                  <span className="h-1 w-10 rounded-full bg-line" />
                </div>
                {list}
              </div>
            </div>
          ) : (
            <div
              className="z-[80] hidden overflow-hidden rounded-2xl border border-line bg-card shadow-sheet sm:block"
              ref={menuRef}
              style={menuStyle}
            >
              {list}
            </div>
          )}
        </Portal>
      ) : null}
    </div>
  );
}
