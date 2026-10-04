import { generateInstallments } from "@/modules/installment/domain/generate-installments";
import { addMonths, withDayOfMonth } from "@/shared/utils/date";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import type { WorkspaceRepository } from "@/modules/workspace/domain/workspace-repository";
import { fail, ok, type Result } from "@/shared/types/result";
import type { DebtKind, DebtWithInstallments } from "../domain/debt";
import type { DebtRepository } from "../domain/debt-repository";

export interface CreateDebtInput {
  workspaceId: string;
  actorId: string;
  name: string;
  kind?: DebtKind;
  installmentCount: number;
  autoPay?: boolean;
  remindersEnabled?: boolean;
  recurringAmountCents?: number;
  recurringDay?: number;
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

  const kind: DebtKind = input.kind === "RECURRING" ? "RECURRING" : "INSTALLMENT";

  if (kind === "RECURRING") {
    return createRecurringDebt(input, name, debts);
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
    kind: "INSTALLMENT",
    autoPay: Boolean(input.autoPay),
    remindersEnabled: Boolean(input.remindersEnabled),
    ownerId: input.ownerId,
    createdById: input.actorId,
    installments,
  });

  return ok(debt);
}

async function createRecurringDebt(
  input: CreateDebtInput,
  name: string,
  debts: DebtRepository,
): Promise<Result<DebtWithInstallments>> {
  const amountCents = input.recurringAmountCents ?? input.totalAmountCents ?? 0;
  if (amountCents < 100) {
    return fail("INVALID_AMOUNT", "Valor mensal minimo de R$ 1,00");
  }

  const day = input.recurringDay ?? input.firstDueDate.getUTCDate();
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return fail("INVALID_DAY", "Dia do vencimento entre 1 e 31");
  }

  const firstDue = withDayOfMonth(input.firstDueDate, day);

  const debt = await debts.create({
    workspaceId: input.workspaceId,
    name,
    totalAmountCents: amountCents,
    installmentCount: 1,
    kind: "RECURRING",
    autoPay: Boolean(input.autoPay),
    remindersEnabled: Boolean(input.remindersEnabled),
    recurringAmountCents: amountCents,
    recurringDay: day,
    ownerId: input.ownerId,
    createdById: input.actorId,
    installments: [
      {
        number: 1,
        amountCents,
        dueDate: firstDue,
      },
    ],
  });

  return ok(debt);
}
