import { fail, ok, type Result } from "@/shared/types/result";
import { isAdmin } from "../domain/workspace";
import type { WorkspaceRepository } from "../domain/workspace-repository";

export async function renameWorkspace(
  workspaceId: string,
  actorId: string,
  name: string,
  workspaces: WorkspaceRepository,
): Promise<Result<{ name: string }>> {
  const actor = await workspaces.findMember(workspaceId, actorId);
  if (!actor || !isAdmin(actor)) {
    return fail("FORBIDDEN", "So o administrador edita o espaco");
  }

  const nextName = name.trim();
  if (nextName.length < 2) {
    return fail("INVALID_NAME", "Informe o nome do espaco");
  }

  await workspaces.rename(workspaceId, nextName);
  return ok({ name: nextName });
}
