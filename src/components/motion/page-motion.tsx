"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

export function PageMotion({
  children,
  className = "",
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

    const items = root.querySelectorAll<HTMLElement>("[data-page]");
    if (items.length === 0) {
      return;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 1023px)").matches;

    if (reduce || mobile) {
      gsap.set(items, { clearProps: "transform,filter,opacity" });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          stagger: 0.07,
          ease: "power3.out",
          overwrite: "auto",
          onComplete: () => {
            gsap.set(items, { clearProps: "transform,filter,opacity" });
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
