import { formatMonthBadge } from "@/shared/utils/date";

export function MonthBadge({ date, className = "" }: { date: Date; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-pine-soft px-2 py-0.5 text-xs font-semibold text-pine-dark ${className}`}
    >
      {formatMonthBadge(date)}
    </span>
  );
}
