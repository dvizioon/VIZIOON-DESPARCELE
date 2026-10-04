import type { DebtWithInstallments } from "@/modules/debt/domain/debt";
import {
  SnowballStrategy,
  type PriorityStrategy,
  type PrioritySuggestion,
} from "../domain/priority-strategy";

export function calculatePriority(
  debts: DebtWithInstallments[],
  strategy: PriorityStrategy = new SnowballStrategy(),
): PrioritySuggestion | null {
  return strategy.suggest(debts);
}
