import { prisma } from "@/shared/infrastructure/prisma";

export type AutoPayLoanResult = {
  paidCount: number;
  installmentIds: string[];
};

/** Baixa automática: parcelas PENDING vencidas de dívidas com autoPay. */
export async function autoPayDueLoanInstallments(now = new Date()): Promise<AutoPayLoanResult> {
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const due = await prisma.installment.findMany({
    where: {
      status: "PENDING",
      dueDate: { lte: endOfToday },
      debt: { autoPay: true },
    },
    select: {
      id: true,
      debt: { select: { ownerId: true } },
    },
    orderBy: [{ dueDate: "asc" }, { number: "asc" }],
  });

  const installmentIds: string[] = [];
  const paidAt = new Date();

  for (const item of due) {
    await prisma.installment.update({
      where: { id: item.id },
      data: {
        status: "PAID",
        paidAt,
        paidByUserId: item.debt.ownerId,
        reminderDisabled: true,
      },
    });
    installmentIds.push(item.id);
  }

  return { paidCount: installmentIds.length, installmentIds };
}
