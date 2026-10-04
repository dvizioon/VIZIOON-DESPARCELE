import {
  nextPendingInstallment,
  remainingAmountCents,
  remainingInstallments,
} from "@/modules/installment/domain/installment";
import { calculatePriority } from "@/modules/payment-priority/application/calculate-priority";
import type { PrioritySuggestion } from "@/modules/payment-priority/domain/priority-strategy";
import type { WorkspaceAccess } from "@/modules/workspace/application/require-workspace-access";
import { endOfMonth, startOfMonth } from "@/shared/utils/date";
import type { DebtWithInstallments } from "../domain/debt";

export interface UpcomingInstallment {
  installmentId: string;
  debtId: string;
  debtName: string;
  ownerId: string;
  ownerName: string;
  number: number;
  amountCents: number;
  dueDate: Date;
  overdue: boolean;
}

export interface MemberScore {
  userId: string;
  name: string;
  paidThisMonthCents: number;
  paidCountThisMonth: number;
  remainingCents: number;
  remainingCount: number;
}

export interface DebtSlice {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  remainingCents: number;
  paidCents: number;
  remainingCount: number;
  installmentCount: number;
}

export interface DashboardData {
  access: WorkspaceAccess;
  totalDueCents: number;
  paidTotalCents: number;
  monthDueCents: number;
  monthCount: number;
  paidThisMonthCents: number;
  overdueCount: number;
  overdueCents: number;
  openDebtCount: number;
  progressPercent: number;
  suggestion: PrioritySuggestion | null;
  upcoming: UpcomingInstallment[];
  scores: MemberScore[];
  slices: DebtSlice[];
  debts: DebtWithInstallments[];
}

export function buildDashboard(
  access: WorkspaceAccess,
  debts: DebtWithInstallments[],
  now = new Date(),
): DashboardData {
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcoming: UpcomingInstallment[] = debts.flatMap((debt) =>
    debt.installments
      .filter((item) => item.status === "PENDING")
      .filter((item) => item.dueDate <= monthEnd)
      .map((item) => ({
        installmentId: item.id,
        debtId: debt.id,
        debtName: debt.name,
        ownerId: debt.ownerId,
        ownerName: debt.ownerName,
        number: item.number,
        amountCents: item.amountCents,
        dueDate: item.dueDate,
        overdue: item.dueDate < today,
      })),
  );

  upcoming.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const monthPending = upcoming.filter((item) => item.dueDate >= monthStart);
  const overdue = upcoming.filter((item) => item.overdue);

  const totalDueCents = debts.reduce(
    (sum, debt) => sum + remainingAmountCents(debt.installments),
    0,
  );

  const paidTotalCents = debts.reduce((sum, debt) => {
    return (
      sum +
      debt.installments
        .filter((item) => item.status === "PAID")
        .reduce((inner, item) => inner + item.amountCents, 0)
    );
  }, 0);

  const paidThisMonthCents = debts.reduce((sum, debt) => {
    return (
      sum +
      debt.installments
        .filter((item) => {
          return (
            item.status === "PAID" &&
            item.paidAt !== null &&
            item.paidAt >= monthStart &&
            item.paidAt <= monthEnd
          );
        })
        .reduce((inner, item) => inner + item.amountCents, 0)
    );
  }, 0);

  const openDebtCount = debts.filter(
    (debt) => remainingInstallments(debt.installments) > 0,
  ).length;

  const totalAmountCents = debts.reduce((sum, debt) => sum + debt.totalAmountCents, 0);
  const progressPercent =
    totalAmountCents === 0 ? 100 : Math.round((paidTotalCents / totalAmountCents) * 100);

  const scores = access.members.map((member) => {
    const owned = debts.filter((debt) => debt.ownerId === member.userId);
    const paidThisMonth = debts.flatMap((debt) => debt.installments).filter((item) => {
      return (
        item.status === "PAID" &&
        item.paidByUserId === member.userId &&
        item.paidAt !== null &&
        item.paidAt >= monthStart &&
        item.paidAt <= monthEnd
      );
    });

    return {
      userId: member.userId,
      name: member.userName,
      paidThisMonthCents: paidThisMonth.reduce((sum, item) => sum + item.amountCents, 0),
      paidCountThisMonth: paidThisMonth.length,
      remainingCents: owned.reduce(
        (sum, debt) => sum + remainingAmountCents(debt.installments),
        0,
      ),
      remainingCount: owned.reduce(
        (sum, debt) => sum + remainingInstallments(debt.installments),
        0,
      ),
    };
  });

  scores.sort((a, b) => b.paidThisMonthCents - a.paidThisMonthCents);

  const slices = debts
    .map((debt) => ({
      id: debt.id,
      name: debt.name,
      ownerId: debt.ownerId,
      ownerName: debt.ownerName,
      remainingCents: remainingAmountCents(debt.installments),
      paidCents: debt.totalAmountCents - remainingAmountCents(debt.installments),
      remainingCount: remainingInstallments(debt.installments),
      installmentCount: debt.installmentCount,
    }))
    .sort((a, b) => b.remainingCents - a.remainingCents);

  return {
    access,
    totalDueCents,
    paidTotalCents,
    monthDueCents: monthPending.reduce((sum, item) => sum + item.amountCents, 0),
    monthCount: monthPending.length,
    paidThisMonthCents,
    overdueCount: overdue.length,
    overdueCents: overdue.reduce((sum, item) => sum + item.amountCents, 0),
    openDebtCount,
    progressPercent,
    suggestion: calculatePriority(debts),
    upcoming,
    scores,
    slices,
    debts,
  };
}

export function toDebtCard(debt: DebtWithInstallments) {
  const next = nextPendingInstallment(debt.installments);

  return {
    id: debt.id,
    name: debt.name,
    ownerName: debt.ownerName,
    createdByName: debt.createdByName,
    remainingCents: remainingAmountCents(debt.installments),
    totalAmountCents: debt.totalAmountCents,
    remainingCount: remainingInstallments(debt.installments),
    installmentCount: debt.installmentCount,
    nextAmountCents: next?.amountCents ?? 0,
    nextDueDate: next?.dueDate ?? null,
    nextNumber: next?.number ?? null,
  };
}
