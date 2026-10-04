import { firstName } from "@/modules/auth/domain/user";
import { canEditContent } from "@/modules/workspace/domain/workspace";
import { addMonths, toDateInputValue } from "@/shared/utils/date";
import type { DashboardData } from "./get-dashboard";

export interface DashboardMember {
  userId: string;
  name: string;
  firstName: string;
}

export interface DashboardUpcomingView {
  installmentId: string;
  debtId: string;
  debtName: string;
  ownerId: string;
  ownerName: string;
  number: number;
  amountCents: number;
  dueDate: string;
  overdue: boolean;
  autoPay: boolean;
}

export interface DashboardView {
  workspaceId: string;
  workspaceName: string;
  shared: boolean;
  currentUserId: string;
  totalDueCents: number;
  paidTotalCents: number;
  monthDueCents: number;
  monthCount: number;
  paidThisMonthCents: number;
  overdueCount: number;
  overdueCents: number;
  openDebtCount: number;
  progressPercent: number;
  suggestion: {
    debtId: string;
    debtName: string;
    remainingCount: number;
    nextAmountCents: number;
    reason: string;
  } | null;
  upcoming: DashboardUpcomingView[];
  scores: {
    userId: string;
    name: string;
    firstName: string;
    paidThisMonthCents: number;
    paidCountThisMonth: number;
    remainingCents: number;
    remainingCount: number;
  }[];
  slices: {
    id: string;
    name: string;
    ownerId: string;
    ownerName: string;
    autoPay: boolean;
    remainingCents: number;
    paidCents: number;
    remainingCount: number;
    installmentCount: number;
  }[];
  members: DashboardMember[];
  defaultDueDate: string;
  canEdit: boolean;
}

export function toDashboardView(data: DashboardData): DashboardView {
  return {
    workspaceId: data.access.workspace.id,
    workspaceName: data.access.workspace.name,
    shared: data.access.workspace.type === "SHARED",
    currentUserId: data.access.member.userId,
    totalDueCents: data.totalDueCents,
    paidTotalCents: data.paidTotalCents,
    monthDueCents: data.monthDueCents,
    monthCount: data.monthCount,
    paidThisMonthCents: data.paidThisMonthCents,
    overdueCount: data.overdueCount,
    overdueCents: data.overdueCents,
    openDebtCount: data.openDebtCount,
    progressPercent: data.progressPercent,
    suggestion: data.suggestion
      ? {
          debtId: data.suggestion.debtId,
          debtName: data.suggestion.debtName,
          remainingCount: data.suggestion.remainingCount,
          nextAmountCents: data.suggestion.nextAmountCents,
          reason: data.suggestion.reason,
        }
      : null,
    upcoming: data.upcoming.map((item) => ({
      installmentId: item.installmentId,
      debtId: item.debtId,
      debtName: item.debtName,
      ownerId: item.ownerId,
      ownerName: item.ownerName,
      number: item.number,
      amountCents: item.amountCents,
      dueDate: item.dueDate.toISOString(),
      overdue: item.overdue,
      autoPay: item.autoPay,
    })),
    scores: data.scores.map((score) => ({
      ...score,
      firstName: firstName(score.name),
    })),
    slices: data.slices,
    members: data.access.members.map((member) => ({
      userId: member.userId,
      name: member.userName,
      firstName: firstName(member.userName),
    })),
    defaultDueDate: toDateInputValue(addMonths(new Date(), 1)),
    canEdit: canEditContent(data.access.member),
  };
}
