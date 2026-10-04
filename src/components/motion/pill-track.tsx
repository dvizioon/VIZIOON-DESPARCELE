"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

export function PillTrack({
  children,
  className = "",
  pillClassName = "bg-white shadow-sm",
  watch,
}: {
  children: ReactNode;
  className?: string;
  pillClassName?: string;
  watch?: unknown;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const readyRef = useRef(false);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const pill = pillRef.current;
    if (!wrap || !pill) {
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const place = (animate: boolean) => {
      const active = wrap.querySelector<HTMLElement>("[data-pill-active='true']");
      if (!active) {
        return;
      }

      const wrapBox = wrap.getBoundingClientRect();
      const box = active.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) {
        return;
      }

      const next = {
        x: box.left - wrapBox.left + wrap.scrollLeft,
        y: box.top - wrapBox.top + wrap.scrollTop,
        width: box.width,
        height: box.height,
        opacity: 1,
      };

      if (animate && !reduce) {
        gsap.to(pill, {
          ...next,
          duration: 0.42,
          ease: "power3.out",
          overwrite: "auto",
        });
        return;
      }

      gsap.set(pill, next);
    };

    const animateMove = readyRef.current;
    readyRef.current = true;
    place(animateMove);

    const raf = window.requestAnimationFrame(() => place(false));
    const observer = new ResizeObserver(() => place(false));
    observer.observe(wrap);
    void document.fonts?.ready.then(() => place(false));

    const onResize = () => place(false);
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [watch]);

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <span
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 rounded-full opacity-0 ${pillClassName}`}
        ref={pillRef}
      />
      {children}
    </div>
  );
}
