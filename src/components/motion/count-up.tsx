"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { formatBRL } from "@/shared/utils/money";

export function CountUpMoney({ cents, className }: { cents: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const state = { value: 0 };
    const animation = gsap.to(state, {
      value: cents,
      duration: 0.9,
      ease: "power2.out",
      onUpdate: () => {
        node.textContent = formatBRL(Math.round(state.value));
      },
    });

    return () => {
      animation.kill();
      node.textContent = formatBRL(cents);
    };
  }, [cents]);

  return (
    <span className={className} ref={ref}>
      {formatBRL(0)}
    </span>
  );
}
