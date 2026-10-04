import { prisma } from "@/shared/infrastructure/prisma";
import { mapInstallment } from "@/modules/installment/infrastructure/prisma-installment-repository";
import { centsToDecimalString, toCents } from "@/shared/utils/money";
import type { CreateDebtRecordInput, DebtRepository } from "../domain/debt-repository";
import type { Debt, DebtWithInstallments } from "../domain/debt";

export class PrismaDebtRepository implements DebtRepository {
  async create(input: CreateDebtRecordInput): Promise<DebtWithInstallments> {
    const row = await prisma.debt.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        totalAmount: centsToDecimalString(input.totalAmountCents),
        installmentCount: input.installmentCount,
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
      orderBy: { createdAt: "desc" },
    });

    return rows.map(mapDebt);
  }

  async rename(id: string, name: string): Promise<void> {
    await prisma.debt.update({
      where: { id },
      data: { name },
    });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.debt.delete({ where: { id } });
  }
}

const debtInclude = {
  owner: true,
  createdBy: true,
  installments: {
    include: { paidBy: true },
    orderBy: { number: "asc" as const },
  },
};

function mapDebt(row: {
  id: string;
  workspaceId: string;
  name: string;
  totalAmount: { toString(): string };
  installmentCount: number;
  ownerId: string;
  createdById: string;
  createdAt: Date;
  owner: { name: string };
  createdBy: { name: string };
  installments: Parameters<typeof mapInstallment>[0][];
}): DebtWithInstallments {
  const debt: Debt = {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    totalAmountCents: toCents(row.totalAmount.toString()),
    installmentCount: row.installmentCount,
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
