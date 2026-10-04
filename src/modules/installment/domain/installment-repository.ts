import type { Installment } from "./installment";

export interface MarkInstallmentPaidInput {
  installmentId: string;
  paidByUserId: string;
  receiptUrl: string | null;
}

export interface InstallmentRepository {
  findById(id: string): Promise<Installment | null>;
  markPaid(input: MarkInstallmentPaidInput): Promise<Installment>;
  markPending(installmentId: string): Promise<Installment>;
  clearReceipt(installmentId: string): Promise<Installment>;
  setReminderDisabled(installmentId: string, disabled: boolean): Promise<Installment>;
  updateAmounts(updates: Array<{ id: string; amountCents: number }>): Promise<void>;
  updateDueDates(updates: Array<{ id: string; dueDate: Date }>): Promise<void>;
}
