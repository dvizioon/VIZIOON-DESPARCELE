import { prisma } from "@/shared/infrastructure/prisma";
import { mapInstallment } from "@/modules/installment/infrastructure/prisma-installment-repository";
import { centsToDecimalString, toCents } from "@/shared/utils/money";
import type { CreateDebtRecordInput, DebtRepository } from "../domain/debt-repository";
import type { Debt, DebtHideMode, DebtKind, DebtWithInstallments } from "../domain/debt";
import type { InstallmentDraft } from "@/modules/installment/domain/installment";

export class PrismaDebtRepository implements DebtRepository {
  async create(input: CreateDebtRecordInput): Promise<DebtWithInstallments> {
    const row = await prisma.debt.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        totalAmount: centsToDecimalString(input.totalAmountCents),
        installmentCount: input.installmentCount,
        kind: input.kind,
        autoPay: input.autoPay,
        remindersEnabled: input.remindersEnabled,
        recurringAmount:
          input.recurringAmountCents != null
            ? centsToDecimalString(input.recurringAmountCents)
            : null,
        recurringDay: input.recurringDay ?? null,
        sortOrder: await nextSortOrder(input.workspaceId),
        ownerId: input.ownerId,
        createdById: input.createdById,
        installments: {
          create: input.installments.map((item) => ({
            number: item.number,
            amount: centsToDecimalString(item.amountCents),
            dueDate: item.dueDate,
          })),
        },
      },
      include: debtInclude,
    });

    return mapDebt(row);
  }

  async findById(id: string): Promise<DebtWithInstallments | null> {
    const row = await prisma.debt.findUnique({
      where: { id },
      include: debtInclude,
    });

    return row ? mapDebt(row) : null;
  }

  async listByWorkspace(workspaceId: string): Promise<DebtWithInstallments[]> {
    const rows = await prisma.debt.findMany({
      where: { workspaceId },
      include: debtInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return rows.map(mapDebt);
  }

  async listRecurringActive(): Promise<DebtWithInstallments[]> {
    const rows = await prisma.debt.findMany({
      where: {
        kind: "RECURRING",
        recurringPausedAt: null,
        recurringAmount: { not: null },
        recurringDay: { not: null },
      },
      include: debtInclude,
      orderBy: { createdAt: "asc" },
    });

    return rows.map(mapDebt);
  }

  async rename(id: string, name: string): Promise<void> {
    await prisma.debt.update({
      where: { id },
      data: { name },
    });
  }

  async setAutoPay(id: string, autoPay: boolean): Promise<void> {
    await prisma.debt.update({
      where: { id },
      data: { autoPay },
    });
  }

  async setRemindersEnabled(id: string, enabled: boolean): Promise<void> {
    await prisma.debt.update({
      where: { id },
      data: { remindersEnabled: enabled },
    });
  }

  async setRecurringPaused(id: string, paused: boolean): Promise<void> {
    await prisma.debt.update({
      where: { id },
      data: { recurringPausedAt: paused ? new Date() : null },
    });
  }

  async setVisibility(
    id: string,
    hideMode: DebtHideMode,
    hiddenUserIds: string[],
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.debtHiddenFrom.deleteMany({ where: { debtId: id } });
      await tx.debt.update({
        where: { id },
        data: {
          hideMode,
          ...(hideMode === "SELECTED"
            ? {
                hiddenFrom: {
                  create: hiddenUserIds.map((userId) => ({ userId })),
                },
              }
            : {}),
        },
      });
    });
  }

  async reorder(workspaceId: string, orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) {
      return;
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.debt.updateMany({
          where: { id, workspaceId },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  async appendInstallment(
    debtId: string,
    draft: InstallmentDraft,
  ): Promise<DebtWithInstallments> {
    const current = await prisma.debt.findUnique({
      where: { id: debtId },
      include: { installments: true },
    });
    if (!current) {
      throw new Error("Divida nao encontrada");
    }

    const totalCents =
      current.installments.reduce((sum, item) => sum + toCents(item.amount.toString()), 0) +
      draft.amountCents;

    const row = await prisma.debt.update({
      where: { id: debtId },
      data: {
        installmentCount: current.installmentCount + 1,
        totalAmount: centsToDecimalString(totalCents),
        installments: {
          create: {
            number: draft.number,
            amount: centsToDecimalString(draft.amountCents),
            dueDate: draft.dueDate,
          },
        },
      },
      include: debtInclude,
    });

    return mapDebt(row);
  }

  async updateTotalAmount(id: string, totalAmountCents: number): Promise<void> {
    await prisma.debt.update({
      where: { id },
      data: { totalAmount: centsToDecimalString(totalAmountCents) },
    });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.debt.delete({ where: { id } });
  }
}

const debtInclude = {
  owner: true,
  createdBy: true,
  hiddenFrom: true,
  installments: {
    include: { paidBy: true },
    orderBy: { number: "asc" as const },
  },
};

async function nextSortOrder(workspaceId: string): Promise<number> {
  const top = await prisma.debt.aggregate({
    where: { workspaceId },
    _max: { sortOrder: true },
  });
  return (top._max.sortOrder ?? -1) + 1;
}

function mapDebt(row: {
  id: string;
  workspaceId: string;
  name: string;
  totalAmount: { toString(): string };
  installmentCount: number;
  kind: DebtKind;
  autoPay: boolean;
  remindersEnabled: boolean;
  recurringAmount: { toString(): string } | null;
  recurringDay: number | null;
  recurringPausedAt: Date | null;
  hideMode: DebtHideMode;
  sortOrder: number;
  ownerId: string;
  createdById: string;
  createdAt: Date;
  owner: { name: string };
  createdBy: { name: string };
  hiddenFrom: { userId: string }[];
  installments: Parameters<typeof mapInstallment>[0][];
}): DebtWithInstallments {
  const debt: Debt = {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    totalAmountCents: toCents(row.totalAmount.toString()),
    installmentCount: row.installmentCount,
    kind: row.kind,
    autoPay: row.autoPay,
    remindersEnabled: row.remindersEnabled,
    recurringAmountCents: row.recurringAmount
      ? toCents(row.recurringAmount.toString())
      : null,
    recurringDay: row.recurringDay,
    recurringPausedAt: row.recurringPausedAt,
    hideMode: row.hideMode,
    sortOrder: row.sortOrder,
    hiddenUserIds: row.hiddenFrom.map((item) => item.userId),
    ownerId: row.ownerId,
    ownerName: row.owner.name,
    createdById: row.createdById,
    createdByName: row.createdBy.name,
    createdAt: row.createdAt,
  };

  return {
    ...debt,
    installments: row.installments.map(mapInstallment),
  };
}
