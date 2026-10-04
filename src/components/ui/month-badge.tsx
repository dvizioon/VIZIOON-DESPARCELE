import { formatMonthBadge } from "@/shared/utils/date";

export function MonthBadge({ date, className = "" }: { date: Date; className?: string }) {
  return (
    <span
      className={`inline-flex min-w-8 items-center justify-center rounded-lg bg-pine-soft px-2 py-0.5 font-mono text-xs font-semibold tracking-wide text-pine-dark ${className}`}
    >
      {formatMonthBadge(date)}
    </span>
  );
}
