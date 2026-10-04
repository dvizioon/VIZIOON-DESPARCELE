import { notFound } from "next/navigation";
import { InviteForm } from "@/components/forms/invite-form";
import { Reveal } from "@/components/motion/reveal";
import { AppIcon } from "@/components/ui/icon";
import { DeleteWorkspaceButton } from "@/components/workspace/delete-workspace-button";
import { MemberRoleForm } from "@/components/workspace/member-role-form";
import { RemoveMemberButton } from "@/components/workspace/remove-member-button";
import { requireWorkspaceAccess } from "@/modules/workspace/application/require-workspace-access";
import { isAdmin, roleLabel } from "@/modules/workspace/domain/workspace";
import { PrismaWorkspaceRepository } from "@/modules/workspace/infrastructure/prisma-workspace-repository";
import { requireUser } from "@/shared/auth/session";

type MembersPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function MembersPage({ params }: MembersPageProps) {
  const { workspaceId } = await params;
  const user = await requireUser();
  const access = await requireWorkspaceAccess(
    workspaceId,
    user.id,
    new PrismaWorkspaceRepository(),
  );

  if (!access.ok || access.value.workspace.type !== "SHARED") {
    notFound();
  }

  const { members, member, workspace } = access.value;
  const admin = isAdmin(member);

  return (
    <Reveal className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3" data-reveal>
        <h2 className="font-display text-3xl">Pessoas</h2>
        {admin ? (
          <DeleteWorkspaceButton workspaceId={workspaceId} workspaceName={workspace.name} />
        ) : null}
      </div>
      <ul className="grid gap-3">
        {members.map((item) => (
          <li className="sheet flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-reveal key={item.userId}>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-pine-soft text-pine-dark">
                <AppIcon name="tabler:user" className="size-5" />
              </span>
              <div>
                <p className="font-medium">{item.userName}</p>
                <p className="text-sm text-ink/55">{item.userEmail}</p>
              </div>
            </div>
            {admin ? (
              <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-stretch">
                <MemberRoleForm
                  locked={item.userId === workspace.ownerId}
                  role={item.role}
                  userId={item.userId}
                  workspaceId={workspaceId}
                />
                {item.userId === workspace.ownerId ? null : (
                  <RemoveMemberButton
                    userId={item.userId}
                    userName={item.userName}
                    workspaceId={workspaceId}
                  />
                )}
              </div>
            ) : (
              <span className="rounded-full bg-white px-3 py-1 text-sm text-ink/65">
                {roleLabel(item.role)}
              </span>
            )}
          </li>
        ))}
      </ul>

      {admin ? (
        <div className="sheet" data-reveal>
          <h3 className="mb-3 font-display text-2xl">Convidar</h3>
          <InviteForm workspaceId={workspaceId} />
        </div>
      ) : (
        <p className="text-sm text-ink/55" data-reveal>Somente o administrador convida, altera papeis e remove pessoas.</p>
      )}
    </Reveal>
  );
}
