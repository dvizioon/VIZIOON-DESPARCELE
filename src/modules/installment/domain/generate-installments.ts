import { addMonths } from "@/shared/utils/date";
import { splitEvenly } from "@/shared/utils/money";
import type { InstallmentDraft } from "./installment";

export function generateInstallments(
  totalCents: number,
  count: number,
  firstDueDate: Date,
  firstAmountCents?: number,
): InstallmentDraft[] {
  if (count === 1) {
    return [
      {
        number: 1,
        amountCents: totalCents,
        dueDate: firstDueDate,
      },
    ];
  }

  if (firstAmountCents == null) {
    return splitEvenly(totalCents, count).map((amountCents, index) => ({
      number: index + 1,
      amountCents,
      dueDate: addMonths(firstDueDate, index),
    }));
  }

  const rest = splitEvenly(totalCents - firstAmountCents, count - 1);
  return [
    {
      number: 1,
      amountCents: firstAmountCents,
      dueDate: firstDueDate,
    },
    ...rest.map((amountCents, index) => ({
      number: index + 2,
      amountCents,
      dueDate: addMonths(firstDueDate, index + 1),
    })),
  ];
}
