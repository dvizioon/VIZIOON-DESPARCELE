import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminLink } from "@/components/layout/admin-link";
import { LogoMark } from "@/components/brand/logo";
import { CreateDebtModal } from "@/components/forms/create-debt-modal";
import { CreateWorkspaceModal } from "@/components/forms/create-workspace-modal";
import { ProfileHeaderLink } from "@/components/layout/profile-header-link";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { WorkspaceNav } from "@/components/layout/workspace-nav";
import { PageMotion } from "@/components/motion/page-motion";
import { TabStage } from "@/components/motion/tab-stage";
import { WorkspaceArchivedBanner } from "@/components/workspace/workspace-archived-banner";
import { WorkspaceSettingsModal } from "@/components/workspace/workspace-settings-modal";
import { requireWorkspaceAccess } from "@/modules/workspace/application/require-workspace-access";
import { canEditContent, isAdmin, isArchived } from "@/modules/workspace/domain/workspace";
import { PrismaWorkspaceRepository } from "@/modules/workspace/infrastructure/prisma-workspace-repository";
import { requireUser } from "@/shared/auth/session";
import { isSystemAdmin } from "@/modules/auth/domain/user";
import { addMonths, toDateInputValue } from "@/shared/utils/date";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
};

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const workspaces = new PrismaWorkspaceRepository();
  const access = await requireWorkspaceAccess(workspaceId, user.id, workspaces);

  if (!access.ok) {
    notFound();
  }

  const { workspace, members, member } = access.value;
  const canEdit = canEditContent(member);
  const admin = isAdmin(member);
  const archived = isArchived(workspace);
  const base = `/w/${workspace.id}`;

  const navItems = [
    { href: base, icon: "tabler:layout-dashboard", label: "Início" },
    { href: `${base}/mes`, icon: "tabler:calendar-month", label: "Mês" },
    { href: `${base}/pagas`, icon: "tabler:circle-check", label: "Pagas" },
    { href: `${base}/debts`, icon: "tabler:list", label: "Dívidas" },
    ...(workspace.type === "SHARED"
      ? [{ href: `${base}/membros`, icon: "tabler:users", label: "Pessoas" }]
      : []),
  ];

  return (
    <PageMotion className="mx-auto min-h-screen w-full max-w-5xl px-4 py-4 sm:px-5 sm:py-6">
      <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between" data-page>
        <div className="flex min-w-0 items-center gap-3">
          <Link className="shrink-0" href="/workspaces">
            <LogoMark className="size-11 sm:size-12" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-ink/45">Desparcele</p>
            <div className="flex min-w-0 items-center gap-1">
              <h1 className="truncate font-display text-xl leading-none sm:text-2xl">{workspace.name}</h1>
              {admin ? (
                <WorkspaceSettingsModal
                  archived={archived}
                  members={members}
                  ownerId={workspace.ownerId}
                  shared={workspace.type === "SHARED"}
                  workspaceId={workspace.id}
                  workspaceName={workspace.name}
                />
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          {isSystemAdmin(user.systemRole) ? <AdminLink /> : null}
          <CreateWorkspaceModal triggerClassName="btn-ghost" triggerLabel="Novo" />
          <ProfileHeaderLink
            avatarUrl={user.avatarUrl}
            avatarVariant={user.avatarVariant}
            name={user.name}
          />
          <SignOutButton />
        </div>
      </header>

      <div>
        <WorkspaceNav
          extra={
            canEdit ? (
              <CreateDebtModal
                currentUserId={user.id}
                defaultDueDate={toDateInputValue(addMonths(new Date(), 1))}
                members={members.map((item) => ({
                  userId: item.userId,
                  userName: item.userName,
                  userEmail: item.userEmail,
                }))}
                shared={workspace.type === "SHARED"}
                triggerClassName="nav-link"
                triggerLabel="Nova"
                workspaceId={workspace.id}
              />
            ) : undefined
          }
          items={navItems}
        />
      </div>

      {archived ? (
        <div className="mb-4" data-page>
          <WorkspaceArchivedBanner
            canRestore={admin}
            workspaceId={workspace.id}
            workspaceName={workspace.name}
          />
        </div>
      ) : null}

      <TabStage items={navItems.map((item) => item.href)}>{children}</TabStage>
    </PageMotion>
  );
}
