import { fail, ok, type Result } from "@/shared/types/result";
import { normalizeEmail } from "@/modules/auth/domain/user";
import type { UserRepository } from "@/modules/auth/domain/user-repository";
import { isAdmin } from "../domain/workspace";
import type { WorkspaceRepository } from "../domain/workspace-repository";

export interface InviteMemberInput {
  workspaceId: string;
  actorId: string;
  email: string;
  role: "EDITOR" | "VIEWER" | "ADMIN";
}

export async function inviteMember(
  input: InviteMemberInput,
  workspaces: WorkspaceRepository,
  users: UserRepository,
): Promise<Result<{ userId: string; name: string }>> {
  const actor = await workspaces.findMember(input.workspaceId, input.actorId);
  if (!actor || !isAdmin(actor)) {
    return fail("FORBIDDEN", "So o admin pode convidar");
  }

  const workspace = await workspaces.findById(input.workspaceId);
  if (!workspace) {
    return fail("NOT_FOUND", "Espaco nao encontrado");
  }

  if (workspace.type !== "SHARED") {
    return fail("PERSONAL_WORKSPACE", "Espaco pessoal nao aceita convites");
  }

  const email = normalizeEmail(input.email);
  const user = await users.findByEmail(email);

  if (!user) {
    return fail("USER_NOT_FOUND", "Nenhuma conta com esse e-mail");
  }

  if (user.id === input.actorId) {
    return fail("SELF_INVITE", "Voce ja faz parte deste espaco");
  }

  const existing = await workspaces.findMember(input.workspaceId, user.id);
  if (existing) {
    return fail("ALREADY_MEMBER", "Essa pessoa ja esta no espaco");
  }

  await workspaces.addMember(input.workspaceId, user.id, input.role);

  return ok({ userId: user.id, name: user.name });
}
