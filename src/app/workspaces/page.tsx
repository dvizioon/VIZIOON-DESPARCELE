import type { ReactNode } from "react";
import Link from "next/link";
import { CreateWorkspaceModal } from "@/components/forms/create-workspace-modal";
import { AppIcon } from "@/components/ui/icon";
import { ArchiveWorkspaceButton } from "@/components/workspace/archive-workspace-button";
import { DeleteWorkspaceButton } from "@/components/workspace/delete-workspace-button";
import { WorkspaceTrashList } from "@/components/workspace/workspace-trash-list";
import { Reveal } from "@/components/motion/reveal";
import {
  isAdmin,
  parseWorkspaceListView,
  roleLabel,
  workspaceListBucket,
  type WorkspaceSummary,
} from "@/modules/workspace/domain/workspace";
import { PrismaWorkspaceRepository } from "@/modules/workspace/infrastructure/prisma-workspace-repository";
import { requireUser } from "@/shared/auth/session";

type WorkspacesPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function WorkspacesPage({ searchParams }: WorkspacesPageProps) {
  const { view: rawView } = await searchParams;
  const view = parseWorkspaceListView(rawView);
  const user = await requireUser();
  const workspaces = await new PrismaWorkspaceRepository().listByUser(user.id);
  const todos = workspaces.filter((item) => workspaceListBucket(item) === "todos");
  const arquivados = workspaces.filter((item) => workspaceListBucket(item) === "arquivados");
  const lixeira = workspaces.filter((item) => workspaceListBucket(item) === "lixeira");
  const current = view === "arquivados" ? arquivados : view === "lixeira" ? lixeira : todos;

  return (
    <Reveal>
      {view === "lixeira" ? (
        lixeira.length > 0 ? (
          <WorkspaceTrashList
            items={lixeira.map((item) => ({
              id: item.id,
              name: item.name,
              type: item.type,
              role: item.role,
              memberCount: item.memberCount,
              canManage: isAdmin(item),
            }))}
          />
        ) : (
          <EmptyState
            icon="tabler:trash-off"
            title="Lixeira vazia"
            text="Quando um espaço for excluído, ele aparece aqui antes de sumir de vez."
          />
        )
      ) : current.length > 0 ? (
        <ul className="grid gap-3">
          {current.map((workspace) => (
            <WorkspaceRow archived={view === "arquivados"} key={workspace.id} workspace={workspace} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={view === "arquivados" ? "tabler:archive-off" : "tabler:home-plus"}
          title={view === "arquivados" ? "Nenhum espaço arquivado" : "Nenhum espaço ativo"}
          text={
            view === "arquivados"
              ? "Arquivar tira o espaço de Todos sem apagar nada."
              : "Crie um pessoal ou compartilhado para começar."
          }
          action={view === "todos" ? <CreateWorkspaceModal triggerLabel="Criar primeiro espaço" /> : null}
        />
      )}
    </Reveal>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: string;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="sheet flex flex-col items-start gap-4" data-reveal>
      <AppIcon name={icon} className="size-8 text-pine" />
      <div>
        <p className="font-display text-2xl">{title}</p>
        <p className="mt-1 text-ink/60">{text}</p>
      </div>
      {action}
    </div>
  );
}

function WorkspaceRow({
  workspace,
  archived = false,
}: {
  workspace: WorkspaceSummary;
  archived?: boolean;
}) {
  return (
    <li className="sheet flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-reveal>
      <Link className="min-w-0 flex-1" href={`/w/${workspace.id}`}>
        <p className="break-words font-display text-2xl">{workspace.name}</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/60">
          <AppIcon
            name={workspace.type === "SHARED" ? "tabler:users" : "tabler:user"}
            className="size-4 shrink-0"
          />
          {workspace.type === "SHARED" ? "Compartilhado" : "Pessoal"}
          <span className="text-ink/35">·</span>
          {roleLabel(workspace.role)}
          <span className="text-ink/35">·</span>
          {workspace.memberCount} {workspace.memberCount === 1 ? "pessoa" : "pessoas"}
        </p>
      </Link>
      {isAdmin(workspace) ? (
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <ArchiveWorkspaceButton
            archived={archived}
            workspaceId={workspace.id}
            workspaceName={workspace.name}
          />
          <DeleteWorkspaceButton workspaceId={workspace.id} workspaceName={workspace.name} />
        </div>
      ) : null}
    </li>
  );
}
