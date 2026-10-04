import { prisma } from "@/shared/infrastructure/prisma";
import type { SystemRole } from "@/modules/auth/domain/user";
import { isSeedMasterAdmin } from "@/modules/auth/domain/user";
import type { AdminRepository } from "../domain/admin-repository";
import type {
  PlatformOverview,
  PlatformUser,
  PlatformWorkspace,
  SmtpSummary,
  SystemSettings,
} from "../domain/platform";

export class PrismaAdminRepository implements AdminRepository {
  async overview(): Promise<PlatformOverview> {
    const [
      userTotal,
      userDisabled,
      userAdmins,
      workspaceTotal,
      workspaceArchived,
      workspaceTrash,
      workspacePersonal,
      debtTotal,
      providers,
      mailPending,
      mailFailed,
      mailSent,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { disabledAt: { not: null } } }),
      prisma.user.count({ where: { systemRole: "ADMIN", disabledAt: null } }),
      prisma.workspace.count(),
      prisma.workspace.count({ where: { archivedAt: { not: null }, deletedAt: null } }),
      prisma.workspace.count({ where: { deletedAt: { not: null } } }),
      prisma.workspace.count({ where: { type: "PERSONAL" } }),
      prisma.debt.count(),
      prisma.emailProvider.count(),
      prisma.emailOutbox.count({ where: { status: "PENDING" } }),
      prisma.emailOutbox.count({ where: { status: "FAILED" } }),
      prisma.emailOutbox.count({ where: { status: "SENT" } }),
    ]);

    const activeWorkspaces = workspaceTotal - workspaceArchived - workspaceTrash;

    return {
      users: {
        total: userTotal,
        active: userTotal - userDisabled,
        disabled: userDisabled,
        admins: userAdmins,
      },
      workspaces: {
        total: workspaceTotal,
        active: activeWorkspaces,
        archived: workspaceArchived,
        trash: workspaceTrash,
        personal: workspacePersonal,
        shared: workspaceTotal - workspacePersonal,
      },
      debts: { total: debtTotal },
      mail: {
        providers,
        pending: mailPending,
        failed: mailFailed,
        sent: mailSent,
      },
    };
  }

  async smtpSummary(): Promise<SmtpSummary> {
    const [count, fallback] = await Promise.all([
      prisma.emailProvider.count(),
      prisma.emailProvider.findFirst({
        where: { active: true },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        select: { name: true, host: true, isDefault: true },
      }),
    ]);

    return {
      count,
      defaultName: fallback?.name ?? null,
      defaultHost: fallback?.host ?? null,
    };
  }

  async getSystemSettings(): Promise<SystemSettings> {
    const row = await prisma.systemConfig.upsert({
      where: { id: "default" },
      create: { id: "default", allowPublicSignup: true },
      update: {},
    });

    return {
      allowPublicSignup: row.allowPublicSignup,
      updatedAt: row.updatedAt,
    };
  }

  async setAllowPublicSignup(enabled: boolean): Promise<SystemSettings> {
    const row = await prisma.systemConfig.upsert({
      where: { id: "default" },
      create: { id: "default", allowPublicSignup: enabled },
      update: { allowPublicSignup: enabled },
    });

    return {
      allowPublicSignup: row.allowPublicSignup,
      updatedAt: row.updatedAt,
    };
  }

  async listUsers(): Promise<PlatformUser[]> {
    const rows = await prisma.user.findMany({
      include: { _count: { select: { ownedWorkspaces: true } } },
      orderBy: { createdAt: "desc" },
    });

    return rows.map(mapUser);
  }

  async findUser(id: string): Promise<PlatformUser | null> {
    const row = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { ownedWorkspaces: true } } },
    });

    return row ? mapUser(row) : null;
  }

  async countActiveAdmins(): Promise<number> {
    return prisma.user.count({
      where: { systemRole: "ADMIN", disabledAt: null },
    });
  }

  async setUserDisabled(userId: string, disabledAt: Date | null): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { disabledAt },
    });
  }

  async setUserRole(userId: string, role: SystemRole): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { systemRole: role },
    });
  }

  async setUserPassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async listWorkspaces(): Promise<PlatformWorkspace[]> {
    const rows = await prisma.workspace.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, debts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      ownerId: row.owner.id,
      ownerName: row.owner.name,
      ownerEmail: row.owner.email,
      memberCount: row._count.members,
      debtCount: row._count.debts,
      archivedAt: row.archivedAt,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
    }));
  }
}

function mapUser(row: {
  id: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  disabledAt: Date | null;
  createdAt: Date;
  _count: { ownedWorkspaces: number };
}): PlatformUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    systemRole: isSeedMasterAdmin(row.email) ? "ADMIN" : row.systemRole,
    disabledAt: row.disabledAt,
    createdAt: row.createdAt,
    ownedWorkspaceCount: row._count.ownedWorkspaces,
  };
}
