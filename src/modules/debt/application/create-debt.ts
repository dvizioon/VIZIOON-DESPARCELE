import { generateInstallments } from "@/modules/installment/domain/generate-installments";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { DebtWithInstallments } from "../domain/debt";
import type { DebtRepository } from "../domain/debt-repository";

export interface CreateDebtInput {
  workspaceId: string;
  actorId: string;
  name: string;
  totalAmountCents: number;
  installmentCount: number;
  isLoan?: boolean;
  ownerId: string;
  firstDueDate: Date;
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

  if (input.totalAmountCents < 100) {
    return fail("INVALID_AMOUNT", "Valor minimo de R$ 1,00");
  }

  if (input.installmentCount < 1 || input.installmentCount > 360) {
    return fail("INVALID_COUNT", "Parcelas entre 1 e 360");
  }

  const installments = generateInstallments(
    input.totalAmountCents,
    input.installmentCount,
    input.firstDueDate,
  );

  const debt = await debts.create({
    workspaceId: input.workspaceId,
    name,
    totalAmountCents: input.totalAmountCents,
    installmentCount: input.installmentCount,
    isLoan: Boolean(input.isLoan),
    ownerId: input.ownerId,
    createdById: input.actorId,
    installments,
  });

  return ok(debt);
}
