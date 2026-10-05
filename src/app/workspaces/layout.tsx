import { Suspense } from "react";
import { AdminLink } from "@/components/layout/admin-link";
import { CreateWorkspaceModal } from "@/components/forms/create-workspace-modal";
import { ProfileHeaderLink } from "@/components/layout/profile-header-link";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { LogoMark } from "@/components/brand/logo";
import { PageMotion } from "@/components/motion/page-motion";
import { QueryTabStage } from "@/components/motion/tab-stage";
import { WorkspaceViewTabs } from "@/components/workspace/workspace-view-tabs";
import { firstName, isSystemAdmin } from "@/modules/auth/domain/user";
import { workspaceListBucket } from "@/modules/workspace/domain/workspace";
import { PrismaWorkspaceRepository } from "@/modules/workspace/infrastructure/prisma-workspace-repository";
import { requireUser } from "@/shared/auth/session";

export default async function WorkspacesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const workspaces = await new PrismaWorkspaceRepository().listByUser(user.id);
  const todos = workspaces.filter((item) => workspaceListBucket(item) === "todos").length;
  const arquivados = workspaces.filter((item) => workspaceListBucket(item) === "arquivados").length;
  const lixeira = workspaces.filter((item) => workspaceListBucket(item) === "lixeira").length;

  return (
    <PageMotion className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6 sm:px-5 sm:py-10">
      <header className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between" data-page>
        <div className="flex min-w-0 items-center gap-3">
          <LogoMark className="size-12 shrink-0 sm:size-14" />
          <div className="min-w-0">
            <p className="truncate text-sm text-ink/55">Olá, {firstName(user.name)}</p>
            <h1 className="font-display text-3xl sm:text-4xl">Seus espaços</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSystemAdmin(user.systemRole) ? <AdminLink /> : null}
          <CreateWorkspaceModal triggerClassName="btn-primary flex-1 sm:flex-none" />
          <ProfileHeaderLink avatarUrl={user.avatarUrl} name={user.name} showName={false} />
          <SignOutButton />
        </div>
      </header>

      <div>
        <Suspense fallback={<div className="mb-5 h-11 rounded-full bg-white/80" />}>
          <WorkspaceViewTabs counts={{ todos, arquivados, lixeira }} />
        </Suspense>
      </div>

      <Suspense fallback={children}>
        <QueryTabStage items={["todos", "arquivados", "lixeira"]}>{children}</QueryTabStage>
      </Suspense>
    </PageMotion>
  );
}
