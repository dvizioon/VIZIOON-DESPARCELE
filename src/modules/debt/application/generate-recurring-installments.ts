import { calendarDate, withDayOfMonth } from "@/shared/utils/date";
import type { DebtRepository } from "../domain/debt-repository";

export type GenerateRecurringResult = {
  createdCount: number;
  debtIds: string[];
};

/** Gera a parcela do mês de `asOf` para cada dívida recorrente ativa. */
export async function generateRecurringInstallments(
  debts: DebtRepository,
  asOf = new Date(),
): Promise<GenerateRecurringResult> {
  const year = asOf.getFullYear();
  const monthIndex = asOf.getMonth();
  const monthStart = calendarDate(year, monthIndex, 1);
  const monthEnd = calendarDate(year, monthIndex + 1, 0);

  const active = await debts.listRecurringActive();
  const debtIds: string[] = [];
  let createdCount = 0;

  for (const debt of active) {
    if (debt.recurringAmountCents == null || debt.recurringDay == null) {
      continue;
    }

    const already = debt.installments.some((item) => {
      const d = item.dueDate;
      return d >= monthStart && d <= monthEnd;
    });
    if (already) {
      continue;
    }

    const dueDate = withDayOfMonth(calendarDate(year, monthIndex, 1), debt.recurringDay);
    const nextNumber =
      debt.installments.reduce((max, item) => Math.max(max, item.number), 0) + 1;

    await debts.appendInstallment(debt.id, {
      number: nextNumber,
      amountCents: debt.recurringAmountCents,
      dueDate,
    });

    createdCount += 1;
    debtIds.push(debt.id);
  }

  return { createdCount, debtIds };
}
