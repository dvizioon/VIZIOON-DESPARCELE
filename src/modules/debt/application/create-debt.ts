import { generateInstallments } from "@/modules/installment/domain/generate-installments";
import { addMonths } from "@/shared/utils/date";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { DebtWithInstallments } from "../domain/debt";
import type { DebtRepository } from "../domain/debt-repository";

export interface CreateDebtInput {
  workspaceId: string;
  actorId: string;
  name: string;
  installmentCount: number;
  isLoan?: boolean;
  ownerId: string;
  firstDueDate: Date;
  installmentAmountsCents?: number[];
  installmentDueDates?: Date[];
  totalAmountCents?: number;
}

export async function createDebt(
  input: CreateDebtInput,
  debts: DebtRepository,
  workspaces: WorkspaceRepository,
): Promise<Result<DebtWithInstallments>> {
  const actor = await workspaces.findMember(input.workspaceId, input.actorId);
  if (!actor || !canEditContent(actor)) {
    return fail("FORBIDDEN", "Seu papel so permite visualizar");
  }

  const owner = await workspaces.findMember(input.workspaceId, input.ownerId);
  if (!owner) {
    return fail("INVALID_OWNER", "Dono da divida precisa ser do espaco");
  }

  const name = input.name.trim();
  if (name.length < 2) {
    return fail("INVALID_NAME", "Informe o nome da divida");
  }

  if (input.installmentCount < 1 || input.installmentCount > 360) {
    return fail("INVALID_COUNT", "Parcelas entre 1 e 360");
  }

  let installments;
  let totalAmountCents: number;

  if (input.installmentAmountsCents && input.installmentAmountsCents.length > 0) {
    if (input.installmentAmountsCents.length !== input.installmentCount) {
      return fail("INVALID_AMOUNTS", "Quantidade de valores nao bate com as parcelas");
    }
    if (input.installmentAmountsCents.some((value) => value < 1)) {
      return fail("INVALID_AMOUNT", "Cada parcela precisa de pelo menos R$ 0,01");
    }
    if (
      input.installmentDueDates &&
      input.installmentDueDates.length !== input.installmentCount
    ) {
      return fail("INVALID_DATES", "Quantidade de datas nao bate com as parcelas");
    }
    totalAmountCents = input.installmentAmountsCents.reduce((sum, value) => sum + value, 0);
    installments = input.installmentAmountsCents.map((amountCents, index) => ({
      number: index + 1,
      amountCents,
      dueDate:
        input.installmentDueDates?.[index] ?? addMonths(input.firstDueDate, index),
    }));
  } else {
    totalAmountCents = input.totalAmountCents ?? 0;
    if (totalAmountCents < 100) {
      return fail("INVALID_AMOUNT", "Valor minimo de R$ 1,00");
    }
    installments = generateInstallments(
      totalAmountCents,
      input.installmentCount,
      input.firstDueDate,
    );
  }

  const debt = await debts.create({
    workspaceId: input.workspaceId,
    name,
    totalAmountCents,
    installmentCount: input.installmentCount,
    isLoan: Boolean(input.isLoan),
    ownerId: input.ownerId,
    createdById: input.actorId,
    installments,
  });

  return ok(debt);
}
