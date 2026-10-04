import { fail, ok, type Result } from "@/shared/types/result";
import { isAdmin, isArchived, isTrashed } from "../domain/workspace";
import type { WorkspaceRepository } from "../domain/workspace-repository";

export async function archiveWorkspace(
  workspaceId: string,
  actorId: string,
  workspaces: WorkspaceRepository,
): Promise<Result<{ id: string }>> {
  const actor = await workspaces.findMember(workspaceId, actorId);
  if (!actor || !isAdmin(actor)) {
    return fail("FORBIDDEN", "So o administrador pode arquivar o espaco");
  }

  const workspace = await workspaces.findById(workspaceId);
  if (!workspace) {
    return fail("NOT_FOUND", "Espaco nao encontrado");
  }

  if (isTrashed(workspace)) {
    return fail("TRASHED", "Restaure o espaco da lixeira antes de arquivar");
  }

  if (isArchived(workspace)) {
    return fail("ALREADY_ARCHIVED", "Este espaco ja esta arquivado");
  }

  await workspaces.archive(workspaceId);
  return ok({ id: workspaceId });
}

export async function unarchiveWorkspace(
  workspaceId: string,
  actorId: string,
  workspaces: WorkspaceRepository,
): Promise<Result<{ id: string }>> {
  const actor = await workspaces.findMember(workspaceId, actorId);
  if (!actor || !isAdmin(actor)) {
    return fail("FORBIDDEN", "So o administrador pode restaurar o espaco");
  }

  const workspace = await workspaces.findById(workspaceId);
  if (!workspace) {
    return fail("NOT_FOUND", "Espaco nao encontrado");
  }

  if (isTrashed(workspace)) {
    return fail("TRASHED", "Restaure o espaco da lixeira antes");
  }

  if (!isArchived(workspace)) {
    return fail("NOT_ARCHIVED", "Este espaco nao esta arquivado");
  }

  await workspaces.unarchive(workspaceId);
  return ok({ id: workspaceId });
}
