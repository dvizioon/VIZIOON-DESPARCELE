export type InstallmentStatus = "PENDING" | "PAID";

export interface Installment {
  id: string;
  debtId: string;
  number: number;
  amountCents: number;
  dueDate: Date;
  status: InstallmentStatus;
  paidByUserId: string | null;
  paidByName: string | null;
  receiptUrl: string | null;
  paidAt: Date | null;
  reminderDisabled: boolean;
  reminderSentAt: Date | null;
  overdueReminderSentAt: Date | null;
}

export interface InstallmentDraft {
  number: number;
  amountCents: number;
  dueDate: Date;
  /** Ao criar (ex.: recorrente já paga), grava como PAID. */
  status?: InstallmentStatus;
  paidAt?: Date | null;
  paidByUserId?: string | null;
}

export function remainingInstallments(items: Pick<Installment, "status">[]): number {
  return items.filter((item) => item.status === "PENDING").length;
}

export function remainingAmountCents(items: Pick<Installment, "status" | "amountCents">[]): number {
  return items
    .filter((item) => item.status === "PENDING")
    .reduce((sum, item) => sum + item.amountCents, 0);
}

export function nextPendingInstallment<T extends Pick<Installment, "status" | "number">>(
  items: T[],
): T | null {
  const pending = items
    .filter((item) => item.status === "PENDING")
    .sort((a, b) => a.number - b.number);

  return pending[0] ?? null;
}
