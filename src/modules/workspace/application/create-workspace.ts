import { fail, ok, type Result } from "@/shared/types/result";
import type { Workspace, WorkspaceType } from "../domain/workspace";
import type { WorkspaceRepository } from "../domain/workspace-repository";

export interface CreateWorkspaceInput {
  name: string;
  type: WorkspaceType;
  ownerId: string;
}

export async function createWorkspace(
  input: CreateWorkspaceInput,
  workspaces: WorkspaceRepository,
): Promise<Result<Workspace>> {
  const name = input.name.trim();

  if (name.length < 2) {
    return fail("INVALID_NAME", "Informe o nome do espaco");
  }

  const workspace = await workspaces.create({
    name,
    type: input.type,
    ownerId: input.ownerId,
  });

  return ok(workspace);
}
