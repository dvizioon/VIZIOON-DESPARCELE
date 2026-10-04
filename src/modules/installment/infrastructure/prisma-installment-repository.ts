import { prisma } from "@/shared/infrastructure/prisma";
import { centsToDecimalString, toCents } from "@/shared/utils/money";
import type {
  InstallmentRepository,
  MarkInstallmentPaidInput,
} from "../domain/installment-repository";
import type { Installment } from "../domain/installment";

export class PrismaInstallmentRepository implements InstallmentRepository {
  async findById(id: string): Promise<Installment | null> {
    const row = await prisma.installment.findUnique({
      where: { id },
      include: { paidBy: true },
    });

    return row ? mapInstallment(row) : null;
  }

  async markPaid(input: MarkInstallmentPaidInput): Promise<Installment> {
    const row = await prisma.installment.update({
      where: { id: input.installmentId },
      data: {
        status: "PAID",
        paidByUserId: input.paidByUserId,
        receiptUrl: input.receiptUrl,
        paidAt: new Date(),
      },
      include: { paidBy: true },
    });

    return mapInstallment(row);
  }

  async markPending(installmentId: string): Promise<Installment> {
    const row = await prisma.installment.update({
      where: { id: installmentId },
      data: {
        status: "PENDING",
        paidByUserId: null,
        receiptUrl: null,
        paidAt: null,
      },
      include: { paidBy: true },
    });

    return mapInstallment(row);
  }

  async clearReceipt(installmentId: string): Promise<Installment> {
    const row = await prisma.installment.update({
      where: { id: installmentId },
      data: { receiptUrl: null },
      include: { paidBy: true },
    });

    return mapInstallment(row);
  }

  async updateAmounts(updates: Array<{ id: string; amountCents: number }>): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    await prisma.$transaction(
      updates.map((item) =>
        prisma.installment.update({
          where: { id: item.id },
          data: { amount: centsToDecimalString(item.amountCents) },
        }),
      ),
    );
  }
}

export function mapInstallment(row: {
  id: string;
  debtId: string;
  number: number;
  amount: { toString(): string };
  dueDate: Date;
  status: "PENDING" | "PAID";
  paidByUserId: string | null;
  receiptUrl: string | null;
  paidAt: Date | null;
  paidBy?: { name: string } | null;
}): Installment {
  return {
    id: row.id,
    debtId: row.debtId,
    number: row.number,
    amountCents: toCents(row.amount.toString()),
    dueDate: row.dueDate,
    status: row.status,
    paidByUserId: row.paidByUserId,
    paidByName: row.paidBy?.name ?? null,
    receiptUrl: row.receiptUrl,
    paidAt: row.paidAt,
  };
}
