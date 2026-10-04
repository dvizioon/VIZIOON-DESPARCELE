const APP_TZ = "America/Sao_Paulo";

/** Data de calendário (vencimento) em meio-dia UTC, sem virar o dia no Brasil. */
export function calendarDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
}

function utcParts(date: Date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

export function addMonths(date: Date, months: number): Date {
  const { year, month, day } = utcParts(date);
  const cursor = calendarDate(year, month + months, 1);
  const lastDay = new Date(
    Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return calendarDate(cursor.getUTCFullYear(), cursor.getUTCMonth(), Math.min(day, lastDay));
}

/** Troca só o dia, mantendo mês/ano do vencimento. */
export function withDayOfMonth(date: Date, day: number): Date {
  const { year, month } = utcParts(date);
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const safeDay = Math.min(Math.max(1, day), lastDay);
  return calendarDate(year, month, safeDay);
}

export function startOfMonth(date: Date): Date {
  const { year, month } = partsInAppTz(date);
  return new Date(year, month - 1, 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
  const { year, month } = partsInAppTz(date);
  return new Date(year, month, 0, 23, 59, 59, 999);
}

export function isSameMonth(left: Date, right: Date): boolean {
  const a = partsInAppTz(left);
  const b = partsInAppTz(right);
  return a.year === b.year && a.month === b.month;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: APP_TZ,
  }).format(date);
}

export function formatDateFull(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: APP_TZ,
  }).format(date);
}

/** Badge do mês de vencimento, ex. Mês 08 */
export function formatMonthBadge(date: Date): string {
  const month = String(utcParts(date).month + 1).padStart(2, "0");
  return `Mês ${month}`;
}

export function toDateInputValue(date: Date): string {
  const { year, month, day } = partsInAppTz(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Para datas de vencimento já salvas (meio-dia UTC). */
export function toCalendarInputValue(date: Date): string {
  const { year, month, day } = utcParts(date);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error("Data invalida");
  }
  return calendarDate(year, month - 1, day);
}

function partsInAppTz(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}
