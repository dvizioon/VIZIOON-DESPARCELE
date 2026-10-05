"use client";

import { AppIcon } from "@/components/ui/icon";
import { Tip } from "@/components/ui/tip";

type FancyCheckboxProps = {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
  tip?: string;
  disabled?: boolean;
  className?: string;
};

export function FancyCheckbox({
  checked,
  label,
  onChange,
  tip,
  disabled = false,
  className = "",
}: FancyCheckboxProps) {
  return (
    <button
      aria-checked={checked}
      className={`group inline-flex items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition ${
        checked
          ? "border-pine/40 bg-pine-soft/70 text-pine-dark shadow-sm"
          : "border-line bg-white/70 text-ink/75 hover:border-pine/25 hover:bg-white"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      role="checkbox"
      type="button"
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
          checked
            ? "border-pine bg-pine text-white"
            : "border-ink/25 bg-white text-transparent group-hover:border-pine/50"
        }`}
      >
        <AppIcon name="tabler:check" className="size-3.5" />
      </span>
      <span className="inline-flex min-w-0 items-center gap-1.5">
        <span className="text-sm font-medium leading-tight">{label}</span>
        {tip ? <Tip content={tip} /> : null}
      </span>
    </button>
  );
}
