import { addMonths } from "@/shared/utils/date";
import { splitEvenly } from "@/shared/utils/money";
import type { InstallmentDraft } from "./installment";

export function generateInstallments(
  totalCents: number,
  count: number,
  firstDueDate: Date,
): InstallmentDraft[] {
  return splitEvenly(totalCents, count).map((amountCents, index) => ({
    number: index + 1,
    amountCents,
    dueDate: addMonths(firstDueDate, index),
  }));
}
