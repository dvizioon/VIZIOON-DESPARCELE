"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function UsageMeter({
  percent,
  paidLabel,
  remainingLabel,
}: {
  percent: number;
  paidLabel: string;
  remainingLabel: string;
}) {
  const fillRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const clamped = Math.min(Math.max(percent, 0), 100);
  const shift = clamped <= 8 ? "0%" : clamped >= 92 ? "-100%" : "-50%";

  useLayoutEffect(() => {
    const fill = fillRef.current;
    if (!fill) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        fill,
        { width: "0%" },
        { width: `${clamped}%`, duration: 0.45, ease: "power3.out" },
      );
      if (shineRef.current && clamped > 0) {
        gsap.fromTo(
          shineRef.current,
          { xPercent: -120 },
          { xPercent: 180, duration: 0.7, ease: "power2.inOut" },
        );
      }
    });

    return () => {
      ctx.revert();
    };
  }, [clamped]);

  return (
    <div className="mt-5">
      <div className="relative mb-2 h-6">
        <span
          className="usage-knob absolute bottom-0 rounded-full bg-pine px-2 py-0.5 font-display text-xs text-white shadow-sm"
          style={{ left: `${clamped}%`, transform: `translateX(${shift})` }}
        >
          {clamped}%
        </span>
      </div>

      <div
        className="usage-track relative h-3.5 overflow-hidden rounded-full"
        role="progressbar"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={clamped}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(26,22,18,0.06)_0%,rgba(26,22,18,0.03)_100%)]" />
        <div
          className="usage-fill absolute inset-y-0 left-0 overflow-hidden rounded-full"
          ref={fillRef}
          style={{ width: 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pine via-[#148576] to-moss" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.35)_0%,transparent_55%)]" />
          <div
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            ref={shineRef}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 text-ink/60">
          <span className="size-2 rounded-full bg-gradient-to-r from-pine to-moss" />
          {paidLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 text-ink/60">
          <span className="size-2 rounded-full bg-ink/15" />
          {remainingLabel}
        </span>
      </div>
    </div>
  );
}
