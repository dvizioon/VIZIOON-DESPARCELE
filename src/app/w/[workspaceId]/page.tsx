import { notFound } from "next/navigation";
import { WorkspaceDashboard } from "@/components/dashboard/workspace-dashboard";
import { toDashboardView } from "@/modules/debt/application/dashboard-view";
import { buildDashboard } from "@/modules/debt/application/get-dashboard";
import { isDebtVisibleTo } from "@/modules/debt/domain/debt";
import { PrismaDebtRepository } from "@/modules/debt/infrastructure/prisma-debt-repository";
import { requireWorkspaceAccess } from "@/modules/workspace/application/require-workspace-access";
import { isAdmin } from "@/modules/workspace/domain/workspace";
import { PrismaWorkspaceRepository } from "@/modules/workspace/infrastructure/prisma-workspace-repository";
import { requireUser } from "@/shared/auth/session";

type DashboardPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const workspaces = new PrismaWorkspaceRepository();
  const access = await requireWorkspaceAccess(workspaceId, user.id, workspaces);

  if (!access.ok) {
    notFound();
  }

  const admin = isAdmin(access.value.member);
  const debts = (await new PrismaDebtRepository().listByWorkspace(workspaceId)).filter((debt) =>
    isDebtVisibleTo(debt, user.id, admin),
  );
  const dashboard = toDashboardView(buildDashboard(access.value, debts));

  return <WorkspaceDashboard data={dashboard} />;
}
