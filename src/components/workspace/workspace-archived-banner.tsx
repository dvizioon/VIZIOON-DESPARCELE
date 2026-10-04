import { ArchiveWorkspaceButton } from "@/components/workspace/archive-workspace-button";
import { AppIcon } from "@/components/ui/icon";

export function WorkspaceArchivedBanner({
  workspaceId,
  workspaceName,
  canRestore,
}: {
  workspaceId: string;
  workspaceName: string;
  canRestore: boolean;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-line bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-paper text-ink/60">
          <AppIcon name="tabler:archive" className="size-5" />
        </span>
        <div>
          <p className="font-medium">Espaço arquivado</p>
          <p className="text-sm text-ink/55">Fora da lista principal. Os dados continuam aqui.</p>
        </div>
      </div>
      {canRestore ? (
        <ArchiveWorkspaceButton archived workspaceId={workspaceId} workspaceName={workspaceName} />
      ) : null}
    </div>
  );
}
