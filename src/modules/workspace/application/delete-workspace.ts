import { fail, ok, type Result } from "@/shared/types/result";
import { isAdmin, isTrashed } from "../domain/workspace";
import type { WorkspaceRepository } from "../domain/workspace-repository";

export async function trashWorkspace(
  workspaceId: string,
  actorId: string,
  workspaces: WorkspaceRepository,
): Promise<Result<{ id: string }>> {
  const actor = await workspaces.findMember(workspaceId, actorId);
  if (!actor || !isAdmin(actor)) {
    return fail("FORBIDDEN", "So o administrador pode mover o espaco para a lixeira");
  }

  const workspace = await workspaces.findById(workspaceId);
  if (!workspace) {
    return fail("NOT_FOUND", "Espaco nao encontrado");
  }

  if (isTrashed(workspace)) {
    return fail("ALREADY_TRASHED", "Este espaco ja esta na lixeira");
  }

  await workspaces.moveToTrash(workspaceId);
  return ok({ id: workspaceId });
}

export async function restoreWorkspace(
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

  if (!isTrashed(workspace)) {
    return fail("NOT_TRASHED", "Este espaco nao esta na lixeira");
  }

  await workspaces.restoreFromTrash(workspaceId);
  return ok({ id: workspaceId });
}

export async function permanentlyDeleteWorkspaces(
  workspaceIds: string[],
  actorId: string,
  workspaces: WorkspaceRepository,
): Promise<Result<{ ids: string[] }>> {
  const uniqueIds = [...new Set(workspaceIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return fail("EMPTY", "Selecione ao menos um espaco");
  }

  const allowed: string[] = [];

  for (const workspaceId of uniqueIds) {
    const actor = await workspaces.findMember(workspaceId, actorId);
    if (!actor || !isAdmin(actor)) {
      return fail("FORBIDDEN", "So o administrador apaga de vez");
    }

    const workspace = await workspaces.findById(workspaceId);
    if (!workspace) {
      return fail("NOT_FOUND", "Espaco nao encontrado");
    }

    if (!isTrashed(workspace)) {
      return fail("NOT_TRASHED", "So a lixeira apaga de vez");
    }

    allowed.push(workspaceId);
  }

  await workspaces.deleteByIds(allowed);
  return ok({ ids: allowed });
}
