"use client";

import { AppIcon } from "@/components/ui/icon";

type FancyCheckboxProps = {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
  hint?: string;
  disabled?: boolean;
};

export function FancyCheckbox({
  checked,
  label,
  onChange,
  hint,
  disabled = false,
}: FancyCheckboxProps) {
  return (
    <button
      aria-checked={checked}
      className={`group inline-flex items-center gap-2.5 rounded-2xl border px-3 py-2 text-left transition ${
        checked
          ? "border-pine/40 bg-pine-soft/70 text-pine-dark shadow-sm"
          : "border-line bg-white/70 text-ink/75 hover:border-pine/25 hover:bg-white"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
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
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11px] text-ink/45">{hint}</span> : null}
      </span>
    </button>
  );
}
