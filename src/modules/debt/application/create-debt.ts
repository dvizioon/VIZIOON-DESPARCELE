import { generateInstallments } from "@/modules/installment/domain/generate-installments";
import type { InstallmentDraft } from "@/modules/installment/domain/installment";
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
  /** Quantas cobranças/parcelas já pagas ao cadastrar (0–120). */
  alreadyPaidCount?: number;
  ownerId: string;
  firstDueDate: Date;
  installmentAmountsCents?: number[];
  installmentDueDates?: Date[];
  installmentPaidFlags?: boolean[];
  totalAmountCents?: number;
}

function parseKind(value: DebtKind | undefined): DebtKind {
  if (value === "RECURRING" || value === "VARIABLE") {
    return value;
  }
  return "INSTALLMENT";
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

  const kind = parseKind(input.kind);

  if (kind === "RECURRING" || kind === "VARIABLE") {
    return createMonthlyDebt(input, name, kind, debts);
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
    installments = input.installmentAmountsCents.map((amountCents, index) => {
      const paid = Boolean(input.installmentPaidFlags?.[index]);
      const dueDate =
        input.installmentDueDates?.[index] ?? addMonths(input.firstDueDate, index);
      return {
        number: index + 1,
        amountCents,
        dueDate,
        status: paid ? ("PAID" as const) : ("PENDING" as const),
        paidAt: paid ? dueDate : null,
        paidByUserId: paid ? input.actorId : null,
      };
    });
  } else {
    totalAmountCents = input.totalAmountCents ?? 0;
    if (totalAmountCents < 100) {
      return fail("INVALID_AMOUNT", "Valor minimo de R$ 1,00");
    }
    const alreadyPaid = Math.min(
      input.installmentCount - 1,
      Math.max(0, Math.floor(input.alreadyPaidCount ?? 0)),
    );
    installments = generateInstallments(
      totalAmountCents,
      input.installmentCount,
      input.firstDueDate,
    ).map((item, index) => {
      const paid = index < alreadyPaid;
      return {
        ...item,
        status: paid ? ("PAID" as const) : ("PENDING" as const),
        paidAt: paid ? item.dueDate : null,
        paidByUserId: paid ? input.actorId : null,
      };
    });
  }

  const pendingCount = installments.filter((item) => item.status !== "PAID").length;
  if (pendingCount < 1) {
    return fail("INVALID_COUNT", "Deixe ao menos uma parcela em aberto");
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

async function createMonthlyDebt(
  input: CreateDebtInput,
  name: string,
  kind: "RECURRING" | "VARIABLE",
  debts: DebtRepository,
): Promise<Result<DebtWithInstallments>> {
  const rawAmount = input.recurringAmountCents ?? input.totalAmountCents ?? 0;
  const variable = kind === "VARIABLE";

  // Recorrente exige valor fixo; variável aceita estimativa 0 (usa R$ 0,01 nas linhas)
  if (!variable && rawAmount < 100) {
    return fail("INVALID_AMOUNT", "Valor mensal minimo de R$ 1,00");
  }
  if (variable && rawAmount < 0) {
    return fail("INVALID_AMOUNT", "Estimativa invalida");
  }

  const amountCents = variable ? Math.max(rawAmount, 0) : rawAmount;
  const lineAmountCents = Math.max(amountCents, 1);

  const day = input.recurringDay ?? input.firstDueDate.getUTCDate();
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return fail("INVALID_DAY", "Dia do vencimento entre 1 e 31");
  }

  const nextDue = withDayOfMonth(input.firstDueDate, day);
  const alreadyPaid = Math.min(120, Math.max(0, Math.floor(input.alreadyPaidCount ?? 0)));

  let installments: InstallmentDraft[];

  if (input.installmentAmountsCents && input.installmentAmountsCents.length > 0) {
    if (input.installmentAmountsCents.some((value) => value < 1)) {
      return fail("INVALID_AMOUNT", "Cada parcela precisa de pelo menos R$ 0,01");
    }
    if (
      input.installmentDueDates &&
      input.installmentDueDates.length !== input.installmentAmountsCents.length
    ) {
      return fail("INVALID_DATES", "Quantidade de datas nao bate com as parcelas");
    }

    installments = input.installmentAmountsCents.map((cents, index) => {
      const paid = Boolean(input.installmentPaidFlags?.[index]);
      const dueDate =
        input.installmentDueDates?.[index] ??
        addMonths(nextDue, index - (input.installmentAmountsCents!.length - 1));
      return {
        number: index + 1,
        amountCents: cents,
        dueDate,
        status: paid ? ("PAID" as const) : ("PENDING" as const),
        paidAt: paid ? dueDate : null,
        paidByUserId: paid ? input.actorId : null,
      };
    });
  } else {
    installments = buildRecurringInstallments({
      amountCents: lineAmountCents,
      nextDue,
      alreadyPaid,
      actorId: input.actorId,
    });
  }

  if (installments.length < 1 || installments.length > 121) {
    return fail("INVALID_COUNT", "Gere entre 1 e 121 cobranças");
  }

  const pending = installments.filter((item) => item.status !== "PAID");
  if (pending.length < 1) {
    return fail("INVALID_COUNT", "Deixe ao menos a próxima cobrança em aberto");
  }

  const totalAmountCents = installments.reduce((sum, item) => sum + item.amountCents, 0);
  const estimateCents = amountCents > 0 ? amountCents : null;

  const debt = await debts.create({
    workspaceId: input.workspaceId,
    name,
    totalAmountCents,
    installmentCount: installments.length,
    kind,
    autoPay: Boolean(input.autoPay),
    remindersEnabled: Boolean(input.remindersEnabled),
    recurringAmountCents: variable ? estimateCents : amountCents,
    recurringDay: day,
    ownerId: input.ownerId,
    createdById: input.actorId,
    installments,
  });

  return ok(debt);
}

export function buildRecurringInstallments(input: {
  amountCents: number;
  nextDue: Date;
  alreadyPaid: number;
  actorId: string;
}): InstallmentDraft[] {
  const paid = Math.min(120, Math.max(0, Math.floor(input.alreadyPaid)));
  const rows: InstallmentDraft[] = [];

  for (let i = 0; i < paid; i += 1) {
    const dueDate = addMonths(input.nextDue, -(paid - i));
    rows.push({
      number: i + 1,
      amountCents: input.amountCents,
      dueDate,
      status: "PAID",
      paidAt: dueDate,
      paidByUserId: input.actorId,
    });
  }

  rows.push({
    number: paid + 1,
    amountCents: input.amountCents,
    dueDate: input.nextDue,
    status: "PENDING",
  });

  return rows;
}

/** Valor sugerido para nova cobrança VARIABLE/RECURRING. */
export function suggestMonthlyAmountCents(debt: {
  kind: DebtKind;
  recurringAmountCents: number | null;
  installments: { amountCents: number; number: number }[];
}): number {
  const last = [...debt.installments].sort((a, b) => b.number - a.number)[0];
  if (last && last.amountCents >= 1) {
    return last.amountCents;
  }
  if (debt.recurringAmountCents != null && debt.recurringAmountCents >= 1) {
    return debt.recurringAmountCents;
  }
  return 1;
}
