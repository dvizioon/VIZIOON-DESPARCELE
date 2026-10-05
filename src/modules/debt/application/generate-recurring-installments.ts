import { calendarDate, withDayOfMonth } from "@/shared/utils/date";
import type { DebtRepository } from "../domain/debt-repository";
import { suggestMonthlyAmountCents } from "./create-debt";

export type GenerateRecurringResult = {
  createdCount: number;
  paidOnCreateCount: number;
  debtIds: string[];
};

/** Gera a parcela do mês de `asOf` para cada dívida recorrente/variável ativa. */
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
  let paidOnCreateCount = 0;

  for (const debt of active) {
    if (debt.recurringDay == null) {
      continue;
    }

    // Recorrente fixa ainda exige estimativa/valor cadastrado
    if (debt.kind === "RECURRING" && debt.recurringAmountCents == null) {
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

    const amountCents =
      debt.kind === "VARIABLE"
        ? suggestMonthlyAmountCents(debt)
        : (debt.recurringAmountCents ?? 1);

    const autoPaid = debt.autoPay;

    await debts.appendInstallment(debt.id, {
      number: nextNumber,
      amountCents,
      dueDate,
      status: autoPaid ? "PAID" : "PENDING",
      paidAt: autoPaid ? dueDate : null,
      paidByUserId: autoPaid ? debt.ownerId : null,
    });

    createdCount += 1;
    if (autoPaid) {
      paidOnCreateCount += 1;
    }
    debtIds.push(debt.id);
  }

  return { createdCount, paidOnCreateCount, debtIds };
}
