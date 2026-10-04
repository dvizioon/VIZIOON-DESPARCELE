import { fail, ok, type Result } from "@/shared/types/result";
import { isTrashed, type Workspace, type WorkspaceMember } from "../domain/workspace";
import type { WorkspaceRepository } from "../domain/workspace-repository";

export interface WorkspaceAccess {
  workspace: Workspace;
  member: WorkspaceMember;
  members: WorkspaceMember[];
}

export async function requireWorkspaceAccess(
  workspaceId: string,
  userId: string,
  workspaces: WorkspaceRepository,
): Promise<Result<WorkspaceAccess>> {
  const workspace = await workspaces.findById(workspaceId);
  if (!workspace || isTrashed(workspace)) {
    return fail("NOT_FOUND", "Espaco nao encontrado");
  }

  const member = await workspaces.findMember(workspaceId, userId);
  if (!member) {
    return fail("FORBIDDEN", "Voce nao faz parte deste espaco");
  }

  const members = await workspaces.listMembers(workspaceId);

  return ok({ workspace, member, members });
}
