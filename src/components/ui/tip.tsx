"use client";

import { useState, type ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";

type TipProps = {
  content: string;
  children?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
};

/** `?` ao lado do rótulo: explica sem poluir a tela. */
export function Tip({ content, children, side = "top" }: TipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip.Provider delayDuration={180} skipDelayDuration={0}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          {children ?? (
            <button
              aria-label="Ajuda"
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-white text-[11px] font-medium text-ink/50 transition hover:border-pine/40 hover:text-pine-dark"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setOpen((value) => !value);
              }}
              type="button"
            >
              ?
            </button>
          )}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-[100] max-w-[16rem] rounded-xl border border-line bg-paper px-3 py-2 text-xs leading-relaxed text-ink shadow-lg"
            side={side}
            sideOffset={6}
          >
            {content}
            <Tooltip.Arrow className="fill-paper" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export function LabelWithTip({
  label,
  tip,
}: {
  label: string;
  tip: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <Tip content={tip} />
    </span>
  );
}
