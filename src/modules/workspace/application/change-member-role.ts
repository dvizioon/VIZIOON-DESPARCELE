import { fail, ok, type Result } from "@/shared/types/result";
import { isAdmin, type WorkspaceRole } from "../domain/workspace";
import type { WorkspaceRepository } from "../domain/workspace-repository";

export async function changeMemberRole(
  workspaceId: string,
  actorId: string,
  targetUserId: string,
  role: WorkspaceRole,
  workspaces: WorkspaceRepository,
): Promise<Result<{ userId: string }>> {
  const actor = await workspaces.findMember(workspaceId, actorId);
  if (!actor || !isAdmin(actor)) {
    return fail("FORBIDDEN", "So o administrador altera papeis");
  }

  const workspace = await workspaces.findById(workspaceId);
  if (!workspace) {
    return fail("NOT_FOUND", "Espaco nao encontrado");
  }

  if (targetUserId === workspace.ownerId && role !== "ADMIN") {
    return fail("OWNER_ROLE", "O dono do espaco permanece administrador");
  }

  const target = await workspaces.findMember(workspaceId, targetUserId);
  if (!target) {
    return fail("NOT_FOUND", "Pessoa nao encontrada");
  }

  if (target.role === "ADMIN" && role !== "ADMIN") {
    const admins = (await workspaces.listMembers(workspaceId)).filter((item) => item.role === "ADMIN");
    if (admins.length <= 1) {
      return fail("LAST_ADMIN", "Precisa ficar pelo menos um administrador");
    }
  }

  await workspaces.updateMemberRole(workspaceId, targetUserId, role);
  return ok({ userId: targetUserId });
}
