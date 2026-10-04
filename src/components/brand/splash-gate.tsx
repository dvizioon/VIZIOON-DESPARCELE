"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SplashScreen } from "@/components/brand/splash-screen";

export function SplashGate({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const started = Date.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const min = reduce ? 160 : 800;
    const max = reduce ? 400 : 3200;
    let cancelled = false;
    let hideTimer = 0;

    async function waitUntilReady() {
      try {
        await document.fonts.ready;
      } catch {
        /* ignore */
      }

      if (document.readyState !== "complete") {
        await new Promise<void>((resolve) => {
          window.addEventListener("load", () => resolve(), { once: true });
        });
      }

      const remaining = Math.max(0, min - (Date.now() - started));
      await new Promise((resolve) => window.setTimeout(resolve, remaining));
    }

    void Promise.race([
      waitUntilReady(),
      new Promise((resolve) => window.setTimeout(resolve, max)),
    ]).then(() => {
      if (cancelled) {
        return;
      }

      setLeaving(true);
      hideTimer = window.setTimeout(() => {
        if (!cancelled) {
          setVisible(false);
        }
      }, reduce ? 120 : 520);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {children}
      {visible ? <SplashScreen leaving={leaving} /> : null}
    </>
  );
}
