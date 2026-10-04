"use client";

import type { ReactNode } from "react";
import { PillTrack } from "@/components/motion/pill-track";

export function FilterPills({
  children,
  watch,
  className = "flex min-w-max gap-1 overflow-x-auto rounded-full bg-white/80 p-1",
}: {
  children: ReactNode;
  watch: string;
  className?: string;
}) {
  return (
    <PillTrack className={className} watch={watch}>
      {children}
    </PillTrack>
  );
}
