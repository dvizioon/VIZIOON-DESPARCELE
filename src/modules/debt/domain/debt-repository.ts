import type { InstallmentDraft } from "@/modules/installment/domain/installment";
import type { Debt, DebtHideMode, DebtWithInstallments } from "./debt";

export interface CreateDebtRecordInput {
  workspaceId: string;
  name: string;
  totalAmountCents: number;
  installmentCount: number;
  isLoan: boolean;
  ownerId: string;
  createdById: string;
  installments: InstallmentDraft[];
}

export interface DebtRepository {
  create(input: CreateDebtRecordInput): Promise<DebtWithInstallments>;
  findById(id: string): Promise<DebtWithInstallments | null>;
  listByWorkspace(workspaceId: string): Promise<DebtWithInstallments[]>;
  rename(id: string, name: string): Promise<void>;
  setLoan(id: string, isLoan: boolean): Promise<void>;
  setVisibility(id: string, hideMode: DebtHideMode, hiddenUserIds: string[]): Promise<void>;
  updateTotalAmount(id: string, totalAmountCents: number): Promise<void>;
  deleteById(id: string): Promise<void>;
}
