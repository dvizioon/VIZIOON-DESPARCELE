import type { InstallmentDraft } from "@/modules/installment/domain/installment";
import type { Debt, DebtWithInstallments } from "./debt";

export interface CreateDebtRecordInput {
  workspaceId: string;
  name: string;
  totalAmountCents: number;
  installmentCount: number;
  ownerId: string;
  createdById: string;
  installments: InstallmentDraft[];
}

export interface DebtRepository {
  create(input: CreateDebtRecordInput): Promise<DebtWithInstallments>;
  findById(id: string): Promise<DebtWithInstallments | null>;
  listByWorkspace(workspaceId: string): Promise<DebtWithInstallments[]>;
  rename(id: string, name: string): Promise<void>;
  deleteById(id: string): Promise<void>;
}
