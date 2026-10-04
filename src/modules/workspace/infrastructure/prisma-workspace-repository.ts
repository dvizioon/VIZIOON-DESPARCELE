import { prisma } from "@/shared/infrastructure/prisma";
import { startOfMonth, endOfMonth } from "@/shared/utils/date";
import { toCents } from "@/shared/utils/money";
import type { WorkspaceInsights } from "../domain/workspace-insights";
import type {
  CreateWorkspaceInput,
  WorkspaceRepository,
} from "../domain/workspace-repository";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSummary,
} from "../domain/workspace";

export class PrismaWorkspaceRepository implements WorkspaceRepository {
  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const row = await prisma.workspace.create({
      data: {
        name: input.name,
        type: input.type,
        ownerId: input.ownerId,
        members: {
          create: {
            userId: input.ownerId,
            role: "ADMIN",
          },
        },
      },
    });

    return mapWorkspace(row);
  }

  async findById(id: string): Promise<Workspace | null> {
    const row = await prisma.workspace.findUnique({ where: { id } });
    return row ? mapWorkspace(row) : null;
  }

  async listByUser(userId: string): Promise<WorkspaceSummary[]> {
    const rows = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => ({
      ...mapWorkspace(row.workspace),
      role: row.role,
      memberCount: row.workspace._count.members,
    }));
  }

  async findMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    const row = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { user: true },
    });

    return row ? mapMember(row) : null;
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const rows = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    return rows.map(mapMember);
  }

  async addMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<void> {
    await prisma.workspaceMember.create({
      data: { workspaceId, userId, role },
    });
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
  ): Promise<void> {
    await prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await prisma.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  async rename(workspaceId: string, name: string): Promise<void> {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name },
    });
  }

  async archive(workspaceId: string): Promise<void> {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { archivedAt: new Date() },
    });
  }

  async unarchive(workspaceId: string): Promise<void> {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { archivedAt: null },
    });
  }

  async moveToTrash(workspaceId: string): Promise<void> {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });
  }

  async restoreFromTrash(workspaceId: string): Promise<void> {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: null },
    });
  }

  async deleteById(workspaceId: string): Promise<void> {
    await prisma.workspace.delete({ where: { id: workspaceId } });
  }

  async deleteByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await prisma.workspace.deleteMany({ where: { id: { in: ids } } });
  }

  async getInsights(workspaceId: string): Promise<WorkspaceInsights | null> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inWorkspace = { debt: { workspaceId } };

    const [
      workspace,
      memberGroups,
      debtCount,
      openDebtCount,
      installmentGroups,
      overdueCount,
      paidThisMonth,
      lastPaid,
      noteCount,
      receiptCount,
      topPayers,
    ] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: workspaceId } }),
      prisma.workspaceMember.groupBy({
        by: ["role"],
        where: { workspaceId },
        _count: { _all: true },
      }),
      prisma.debt.count({ where: { workspaceId } }),
      prisma.debt.count({
        where: {
          workspaceId,
          installments: { some: { status: "PENDING" } },
        },
      }),
      prisma.installment.groupBy({
        by: ["status"],
        where: inWorkspace,
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.installment.count({
        where: {
          ...inWorkspace,
          status: "PENDING",
          dueDate: { lt: today },
        },
      }),
      prisma.installment.aggregate({
        where: {
          ...inWorkspace,
          status: "PAID",
          paidAt: { gte: monthStart, lte: monthEnd },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.installment.findFirst({
        where: {
          ...inWorkspace,
          status: "PAID",
          paidAt: { not: null },
        },
        orderBy: { paidAt: "desc" },
        select: { paidAt: true },
      }),
      prisma.debtNote.count({ where: { debt: { workspaceId } } }),
      prisma.installment.count({
        where: {
          ...inWorkspace,
          receiptUrl: { not: null },
        },
      }),
      prisma.installment.groupBy({
        by: ["paidByUserId"],
        where: {
          ...inWorkspace,
          status: "PAID",
          paidByUserId: { not: null },
        },
        _count: { _all: true },
        orderBy: { _count: { paidByUserId: "desc" } },
        take: 1,
      }),
    ]);

    if (!workspace) {
      return null;
    }

    const roleCount = (role: WorkspaceRole) =>
      memberGroups.find((item) => item.role === role)?._count._all ?? 0;

    const paidGroup = installmentGroups.find((item) => item.status === "PAID");
    const pendingGroup = installmentGroups.find((item) => item.status === "PENDING");
    const paidCount = paidGroup?._count._all ?? 0;
    const pendingCount = pendingGroup?._count._all ?? 0;
    const paidTotalCents = decimalToCents(paidGroup?._sum.amount);
    const remainingCents = decimalToCents(pendingGroup?._sum.amount);
    const totalAmountCents = paidTotalCents + remainingCents;
    const progressPercent =
      totalAmountCents === 0 ? 100 : Math.round((paidTotalCents / totalAmountCents) * 100);

    const topPayerId = topPayers[0]?.paidByUserId ?? null;
    const topPayerUser = topPayerId
      ? await prisma.user.findUnique({
          where: { id: topPayerId },
          select: { name: true },
        })
      : null;

    return {
      createdAt: workspace.createdAt.toISOString(),
      archivedAt: workspace.archivedAt?.toISOString() ?? null,
      memberCount: memberGroups.reduce((sum, item) => sum + item._count._all, 0),
      adminCount: roleCount("ADMIN"),
      editorCount: roleCount("EDITOR"),
      viewerCount: roleCount("VIEWER"),
      debtCount,
      openDebtCount,
      settledDebtCount: Math.max(debtCount - openDebtCount, 0),
      installmentCount: paidCount + pendingCount,
      paidCount,
      pendingCount,
      overdueCount,
      paidThisMonthCount: paidThisMonth._count._all,
      paidThisMonthCents: decimalToCents(paidThisMonth._sum.amount),
      paidTotalCents,
      remainingCents,
      totalAmountCents,
      progressPercent,
      noteCount,
      receiptCount,
      lastPaidAt: lastPaid?.paidAt?.toISOString() ?? null,
      topPayerName: topPayerUser?.name ?? null,
      topPayerCount: topPayers[0]?._count._all ?? 0,
    };
  }
}

function mapWorkspace(row: {
  id: string;
  name: string;
  type: Workspace["type"];
  ownerId: string;
  archivedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}): Workspace {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    ownerId: row.ownerId,
    archivedAt: row.archivedAt ?? null,
    deletedAt: row.deletedAt ?? null,
    createdAt: row.createdAt,
  };
}

function decimalToCents(value: { toString(): string } | null | undefined): number {
  if (!value) {
    return 0;
  }

  return toCents(value.toString());
}

function mapMember(row: {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  user: { name: string; email: string };
}): WorkspaceMember {
  return {
    workspaceId: row.workspaceId,
    userId: row.userId,
    role: row.role,
    userName: row.user.name,
    userEmail: row.user.email,
  };
}
