import type { Installment } from "@/modules/installment/domain/installment";

export type DebtHideMode = "NONE" | "ALL" | "SELECTED";
export type DebtKind = "INSTALLMENT" | "RECURRING";

export interface Debt {
  id: string;
  workspaceId: string;
  name: string;
  totalAmountCents: number;
  installmentCount: number;
  kind: DebtKind;
  autoPay: boolean;
  remindersEnabled: boolean;
  recurringAmountCents: number | null;
  recurringDay: number | null;
  recurringPausedAt: Date | null;
  hideMode: DebtHideMode;
  sortOrder: number;
  hiddenUserIds: string[];
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

/** Admin vê tudo. ALL: só admin. SELECTED: some se o user estiver na lista. */
export function isDebtVisibleTo(
  debt: Pick<Debt, "hideMode" | "hiddenUserIds">,
  userId: string,
  actorIsAdmin: boolean,
): boolean {
  if (debt.hideMode === "NONE") {
    return true;
  }

  if (debt.hideMode === "ALL") {
    return actorIsAdmin;
  }

  return !debt.hiddenUserIds.includes(userId);
}

export function isDebtHidden(
  debt: Pick<Debt, "hideMode" | "hiddenUserIds">,
): boolean {
  return debt.hideMode !== "NONE";
}

export function isRecurring(debt: Pick<Debt, "kind">): boolean {
  return debt.kind === "RECURRING";
}

export function isRecurringPaused(debt: Pick<Debt, "kind" | "recurringPausedAt">): boolean {
  return debt.kind === "RECURRING" && debt.recurringPausedAt != null;
}
