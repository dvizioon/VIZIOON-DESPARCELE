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
  updatePaidBy(installmentId: string, paidByUserId: string): Promise<Installment>;
  setReminderDisabled(installmentId: string, disabled: boolean): Promise<Installment>;
  updateAmounts(updates: Array<{ id: string; amountCents: number }>): Promise<void>;
  updateDueDates(updates: Array<{ id: string; dueDate: Date }>): Promise<void>;
  /** Apaga a cobrança, renumerar as restantes e atualiza total/qtd da dívida. */
  deleteAndRenumber(installmentId: string): Promise<void>;
  deleteManyAndRenumber(debtId: string, installmentIds: string[]): Promise<void>;
  reorderByIds(debtId: string, orderedIds: string[]): Promise<void>;
}
