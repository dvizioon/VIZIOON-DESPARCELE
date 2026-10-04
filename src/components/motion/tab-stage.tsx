"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import gsap from "gsap";

export function TabStage({
  children,
  items,
}: {
  children: ReactNode;
  items: string[];
}) {
  const pathname = usePathname();
  const index = resolveIndex(pathname, items);

  return <SlidePanel index={index} watch={pathname}>{children}</SlidePanel>;
}

export function QueryTabStage({
  children,
  items,
  param = "view",
}: {
  children: ReactNode;
  items: string[];
  param?: string;
}) {
  const search = useSearchParams();
  const value = search.get(param) ?? items[0] ?? "";
  const index = Math.max(0, items.indexOf(value));

  return <SlidePanel index={index} watch={value}>{children}</SlidePanel>;
}

function SlidePanel({
  children,
  index,
  watch,
}: {
  children: ReactNode;
  index: number;
  watch: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const previousRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const previous = previousRef.current;
    previousRef.current = index;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (previous === null || previous === index || reduce) {
      gsap.set(root, { clearProps: "transform,opacity" });
      return;
    }

    const direction = index > previous ? 1 : -1;
    gsap.fromTo(
      root,
      { x: 40 * direction, opacity: 0.2 },
      {
        x: 0,
        opacity: 1,
        duration: 0.4,
        ease: "power3.out",
        overwrite: "auto",
        onComplete: () => {
          gsap.set(root, { clearProps: "transform" });
        },
      },
    );
  }, [index, watch]);

  return (
    <div className="overflow-x-clip">
      <div ref={rootRef}>{children}</div>
    </div>
  );
}

function resolveIndex(pathname: string, items: string[]): number {
  let best = 0;
  let bestLength = -1;

  items.forEach((href, index) => {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && href.length >= bestLength) {
      best = index;
      bestLength = href.length;
    }
  });

  return best;
}
