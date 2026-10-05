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
        gsap.set(pill, { opacity: 0 });
        return;
      }

      // offset* é relativo ao wrap (position: relative) — estável com scroll/transform no ancestral
      const width = active.offsetWidth;
      const height = active.offsetHeight;
      if (width < 2 || height < 2) {
        return;
      }

      const next = {
        left: active.offsetLeft,
        top: active.offsetTop,
        width,
        height,
        opacity: 1,
        x: 0,
        y: 0,
      };

      if (animate && !reduce && readyRef.current) {
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
    const raf2 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => place(false));
    });

    const observer = new ResizeObserver(() => place(false));
    observer.observe(wrap);
    for (const child of Array.from(wrap.children)) {
      if (child instanceof HTMLElement && child !== pill) {
        observer.observe(child);
      }
    }

    const mutations = new MutationObserver(() => place(false));
    mutations.observe(wrap, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-pill-active", "class"],
    });

    void document.fonts?.ready.then(() => place(false));

    const onResize = () => place(false);
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(raf);
      window.cancelAnimationFrame(raf2);
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [watch]);

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <span
        aria-hidden
        className={`pointer-events-none absolute rounded-full opacity-0 ${pillClassName}`}
        ref={pillRef}
        style={{ left: 0, top: 0 }}
      />
      {children}
    </div>
  );
}
