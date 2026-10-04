import { fail, ok, type Result } from "@/shared/types/result";
import { isAdmin } from "../domain/workspace";
import type { WorkspaceRepository } from "../domain/workspace-repository";

export async function removeMember(
  workspaceId: string,
  actorId: string,
  targetUserId: string,
  workspaces: WorkspaceRepository,
): Promise<Result<{ userId: string }>> {
  const actor = await workspaces.findMember(workspaceId, actorId);
  if (!actor || !isAdmin(actor)) {
    return fail("FORBIDDEN", "So o administrador tira pessoas do espaco");
  }

  const workspace = await workspaces.findById(workspaceId);
  if (!workspace) {
    return fail("NOT_FOUND", "Espaco nao encontrado");
  }

  if (workspace.type !== "SHARED") {
    return fail("PERSONAL_WORKSPACE", "Espaco pessoal nao tem outras pessoas");
  }

  if (targetUserId === workspace.ownerId) {
    return fail("OWNER", "O dono do espaco nao pode ser removido");
  }

  if (targetUserId === actorId) {
    return fail("SELF", "Voce nao pode se remover. Peca a outro administrador.");
  }

  const target = await workspaces.findMember(workspaceId, targetUserId);
  if (!target) {
    return fail("NOT_FOUND", "Pessoa nao encontrada");
  }

  if (target.role === "ADMIN") {
    const admins = (await workspaces.listMembers(workspaceId)).filter((item) => item.role === "ADMIN");
    if (admins.length <= 1) {
      return fail("LAST_ADMIN", "Precisa ficar pelo menos um administrador");
    }
  }

  await workspaces.removeMember(workspaceId, targetUserId);
  return ok({ userId: targetUserId });
}
