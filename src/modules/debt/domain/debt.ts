import type { Installment } from "@/modules/installment/domain/installment";

export interface Debt {
  id: string;
  workspaceId: string;
  name: string;
  totalAmountCents: number;
  installmentCount: number;
  isLoan: boolean;
  ownerId: string;
  ownerName: string;
  createdById: string;
  createdByName: string;
  createdAt: Date;
}

export interface DebtWithInstallments extends Debt {
  installments: Installment[];
}

export type DebtOwnerFilter = "mine" | "theirs" | "all";

export function matchesOwnerFilter(
  debt: Pick<Debt, "ownerId">,
  userId: string,
  filter: DebtOwnerFilter,
): boolean {
  if (filter === "mine") {
    return debt.ownerId === userId;
  }

  if (filter === "theirs") {
    return debt.ownerId !== userId;
  }

  return true;
}
