"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const items = root.querySelectorAll<HTMLElement>("[data-reveal]");
    if (items.length === 0) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(items, { clearProps: "transform,filter,opacity" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { y: 20, opacity: 0, filter: "blur(8px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.58,
          stagger: 0.07,
          ease: "power3.out",
          overwrite: "auto",
          onComplete: () => {
            gsap.set(items, { clearProps: "transform,filter" });
          },
        },
      );
    }, root);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div className={className} ref={rootRef}>
      {children}
    </div>
  );
}
