export function toRunDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function scheduledAt(day: Date, hour: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
}

export function daysBack(from: Date, n: number): Date[] {
  const base = startOfLocalDay(from);
  const out: Date[] = [];
  for (let i = n; i >= 0; i -= 1) {
    out.push(new Date(base.getFullYear(), base.getMonth(), base.getDate() - i));
  }
  return out;
}
