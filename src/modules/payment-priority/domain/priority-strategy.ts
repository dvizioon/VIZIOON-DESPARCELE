import type { DebtWithInstallments } from "@/modules/debt/domain/debt";
import {
  nextPendingInstallment,
  remainingAmountCents,
  remainingInstallments,
} from "@/modules/installment/domain/installment";

export interface PrioritySuggestion {
  debtId: string;
  debtName: string;
  remainingCount: number;
  remainingCents: number;
  nextAmountCents: number;
  nextDueDate: Date | null;
  reason: string;
}

export interface PriorityStrategy {
  readonly name: string;
  suggest(debts: DebtWithInstallments[]): PrioritySuggestion | null;
}

export class SnowballStrategy implements PriorityStrategy {
  readonly name = "snowball";

  suggest(debts: DebtWithInstallments[]): PrioritySuggestion | null {
    const open = debts
      .map((debt) => {
        const remainingCount = remainingInstallments(debt.installments);
        const next = nextPendingInstallment(debt.installments);

        return {
          debt,
          remainingCount,
          remainingCents: remainingAmountCents(debt.installments),
          next,
        };
      })
      .filter((item) => item.remainingCount > 0 && item.next);

    if (open.length === 0) {
      return null;
    }

    open.sort((a, b) => {
      if (a.remainingCount !== b.remainingCount) {
        return a.remainingCount - b.remainingCount;
      }

      return a.remainingCents - b.remainingCents;
    });

    const chosen = open[0];
    if (!chosen || !chosen.next) {
      return null;
    }

    return {
      debtId: chosen.debt.id,
      debtName: chosen.debt.name,
      remainingCount: chosen.remainingCount,
      remainingCents: chosen.remainingCents,
      nextAmountCents: chosen.next.amountCents,
      nextDueDate: chosen.next.dueDate,
      reason: "Menos parcelas restantes",
    };
  }
}

export class HighestInstallmentStrategy implements PriorityStrategy {
  readonly name = "highest-installment";

  suggest(debts: DebtWithInstallments[]): PrioritySuggestion | null {
    const open = debts
      .map((debt) => {
        const next = nextPendingInstallment(debt.installments);
        return {
          debt,
          remainingCount: remainingInstallments(debt.installments),
          remainingCents: remainingAmountCents(debt.installments),
          next,
        };
      })
      .filter((item) => item.next);

    if (open.length === 0) {
      return null;
    }

    open.sort((a, b) => {
      const left = a.next?.amountCents ?? 0;
      const right = b.next?.amountCents ?? 0;
      return right - left;
    });

    const chosen = open[0];
    if (!chosen || !chosen.next) {
      return null;
    }

    return {
      debtId: chosen.debt.id,
      debtName: chosen.debt.name,
      remainingCount: chosen.remainingCount,
      remainingCents: chosen.remainingCents,
      nextAmountCents: chosen.next.amountCents,
      nextDueDate: chosen.next.dueDate,
      reason: "Maior valor de parcela",
    };
  }
}
