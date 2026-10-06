import type { InstallmentListItem, StatusFilter } from "./types";

export function parseItemDate(value: string): Date {
  return new Date(value.includes("T") ? value : `${value}T12:00:00.000Z`);
}

export function isOverdue(item: InstallmentListItem, now = new Date()): boolean {
  if (item.paid) {
    return false;
  }
  const due = parseItemDate(item.dueDate);
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dueUtc = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return dueUtc < todayUtc;
}

/** Índice da parcela “do mês” (vencimento neste mês; senão a próxima em aberto). */
export function findMonthInstallmentIndex(
  items: InstallmentListItem[],
  now = new Date(),
): number {
  if (items.length === 0) {
    return 0;
  }

  const year = now.getFullYear();
  const month = now.getMonth();

  const inMonth = (item: InstallmentListItem) => {
    const due = parseItemDate(item.dueDate);
    return due.getUTCFullYear() === year && due.getUTCMonth() === month;
  };

  const openInMonth = items.findIndex((item) => !item.paid && inMonth(item));
  if (openInMonth >= 0) {
    return openInMonth;
  }

  const anyInMonth = items.findIndex(inMonth);
  if (anyInMonth >= 0) {
    return anyInMonth;
  }

  const overdue = items.findIndex((item) => isOverdue(item, now));
  if (overdue >= 0) {
    return overdue;
  }

  const open = items.findIndex((item) => !item.paid);
  if (open >= 0) {
    return open;
  }

  return Math.max(0, items.length - 1);
}

/** Números de página com reticências quando há muitas. Ex.: [1, "…", 4, 5, 6, "…", 12] */
export function buildPageItems(current: number, total: number): Array<number | "…"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let p = current - 1; p <= current + 1; p += 1) {
    if (p >= 1 && p <= total) {
      pages.add(p);
    }
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i]!;
    if (i > 0 && page - sorted[i - 1]! > 1) {
      result.push("…");
    }
    result.push(page);
  }
  return result;
}

export function matchesFilter(item: InstallmentListItem, filter: StatusFilter): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "paid") {
    return item.paid;
  }
  if (filter === "overdue") {
    return isOverdue(item);
  }
  return !item.paid;
}

export function splitPipeline(items: InstallmentListItem[]) {
  const overdue: InstallmentListItem[] = [];
  const open: InstallmentListItem[] = [];
  const paid: InstallmentListItem[] = [];
  for (const item of items) {
    if (item.paid) {
      paid.push(item);
    } else if (isOverdue(item)) {
      overdue.push(item);
    } else {
      open.push(item);
    }
  }
  return { overdue, open, paid };
}
