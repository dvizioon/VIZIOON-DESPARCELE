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
