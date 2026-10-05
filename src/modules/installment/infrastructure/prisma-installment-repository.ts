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
        reminderDisabled: true,
      },
      include: { paidBy: true },
    });

    return mapInstallment(row);
  }

  async setReminderDisabled(installmentId: string, disabled: boolean): Promise<Installment> {
    const row = await prisma.installment.update({
      where: { id: installmentId },
      data: { reminderDisabled: disabled },
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

  async updateDueDates(updates: Array<{ id: string; dueDate: Date }>): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    await prisma.$transaction(
      updates.map((item) =>
        prisma.installment.update({
          where: { id: item.id },
          data: { dueDate: item.dueDate },
        }),
      ),
    );
  }

  async deleteAndRenumber(installmentId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const current = await tx.installment.findUnique({ where: { id: installmentId } });
      if (!current) {
        return;
      }

      const debtId = current.debtId;
      await tx.installment.delete({ where: { id: installmentId } });

      const remaining = await tx.installment.findMany({
        where: { debtId },
        orderBy: { number: "asc" },
      });

      // Evita conflito no @@unique([debtId, number])
      for (let i = 0; i < remaining.length; i += 1) {
        await tx.installment.update({
          where: { id: remaining[i]!.id },
          data: { number: 10_000 + i },
        });
      }
      for (let i = 0; i < remaining.length; i += 1) {
        await tx.installment.update({
          where: { id: remaining[i]!.id },
          data: { number: i + 1 },
        });
      }

      const totalCents = remaining.reduce((sum, row) => sum + toCents(row.amount.toString()), 0);
      await tx.debt.update({
        where: { id: debtId },
        data: {
          installmentCount: remaining.length,
          totalAmount: centsToDecimalString(totalCents),
        },
      });
    });
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
  reminderDisabled?: boolean;
  reminderSentAt?: Date | null;
  overdueReminderSentAt?: Date | null;
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
    reminderDisabled: row.reminderDisabled ?? false,
    reminderSentAt: row.reminderSentAt ?? null,
    overdueReminderSentAt: row.overdueReminderSentAt ?? null,
  };
}
