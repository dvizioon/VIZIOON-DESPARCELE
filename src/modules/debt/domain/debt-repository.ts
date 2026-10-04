import type { InstallmentDraft } from "@/modules/installment/domain/installment";
import type { Debt, DebtHideMode, DebtKind, DebtWithInstallments } from "./debt";

export interface CreateDebtRecordInput {
  workspaceId: string;
  name: string;
  totalAmountCents: number;
  installmentCount: number;
  kind: DebtKind;
  autoPay: boolean;
  remindersEnabled: boolean;
  recurringAmountCents?: number | null;
  recurringDay?: number | null;
  ownerId: string;
  createdById: string;
  installments: InstallmentDraft[];
}

export interface DebtRepository {
  create(input: CreateDebtRecordInput): Promise<DebtWithInstallments>;
  findById(id: string): Promise<DebtWithInstallments | null>;
  listByWorkspace(workspaceId: string): Promise<DebtWithInstallments[]>;
  listRecurringActive(): Promise<DebtWithInstallments[]>;
  rename(id: string, name: string): Promise<void>;
  setAutoPay(id: string, autoPay: boolean): Promise<void>;
  setRemindersEnabled(id: string, enabled: boolean): Promise<void>;
  setRecurringPaused(id: string, paused: boolean): Promise<void>;
  setVisibility(id: string, hideMode: DebtHideMode, hiddenUserIds: string[]): Promise<void>;
  reorder(workspaceId: string, orderedIds: string[]): Promise<void>;
  appendInstallment(
    debtId: string,
    draft: InstallmentDraft,
  ): Promise<DebtWithInstallments>;
  updateTotalAmount(id: string, totalAmountCents: number): Promise<void>;
  deleteById(id: string): Promise<void>;
}
