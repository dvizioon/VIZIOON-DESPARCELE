"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AppIcon } from "@/components/ui/icon";

export function HiddenScroll({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canUp, setCanUp] = useState(false);
  const [canDown, setCanDown] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const overflow = el.scrollHeight > el.clientHeight + 2;
    setCanUp(overflow && el.scrollTop > 8);
    setCanDown(overflow && el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    update();
    el.addEventListener("scroll", update, { passive: true });

    const resize = new ResizeObserver(update);
    resize.observe(el);
    if (el.firstElementChild) {
      resize.observe(el.firstElementChild);
    }

    const mutate = new MutationObserver(update);
    mutate.observe(el, { childList: true, subtree: true, characterData: true });
    const later = window.setTimeout(update, 420);

    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
      mutate.disconnect();
      window.clearTimeout(later);
    };
  }, [update]);

  function scrollBy(delta: number) {
    ref.current?.scrollBy({ top: delta, behavior: "smooth" });
  }

  return (
    <div className="relative flex min-h-0 w-full grow flex-col overflow-hidden">
      {canUp ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-card to-transparent" />
          <button
            className="absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full bg-white/90 p-1.5 text-ink/55 shadow-sm ring-1 ring-line backdrop-blur-sm transition hover:text-ink"
            onClick={() => scrollBy(-180)}
            type="button"
          >
            <AppIcon name="tabler:chevron-up" className="size-4" />
            <span className="sr-only">Ver o que está acima</span>
          </button>
        </>
      ) : null}

      <div className={`min-h-0 grow overflow-y-auto overflow-x-hidden scrollbar-none ${className}`} ref={ref}>
        {children}
      </div>

      {canDown ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-card to-transparent" />
          <button
            className="scroll-hint-down absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/90 p-1.5 text-ink/55 shadow-sm ring-1 ring-line backdrop-blur-sm transition hover:text-ink"
            onClick={() => scrollBy(180)}
            type="button"
          >
            <AppIcon name="tabler:chevron-down" className="size-4" />
            <span className="sr-only">Ver o que está abaixo</span>
          </button>
        </>
      ) : null}
    </div>
  );
}
