import { fail, ok, type Result } from "@/shared/types/result";
import { normalizeEmail } from "@/modules/auth/domain/user";
import type { UserRepository } from "@/modules/auth/domain/user-repository";
import { isAdmin, type WorkspaceInvite } from "../domain/workspace";
import type { WorkspaceRepository } from "../domain/workspace-repository";

export interface InviteMemberInput {
  workspaceId: string;
  actorId: string;
  email: string;
  role: "EDITOR" | "VIEWER" | "ADMIN";
}

/** Cria convite pendente. Não adiciona no espaço até a pessoa aceitar. */
export async function inviteMember(
  input: InviteMemberInput,
  workspaces: WorkspaceRepository,
  users: UserRepository,
): Promise<Result<{ invite: WorkspaceInvite; userName: string; hasAccount: boolean }>> {
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
  if (!email.includes("@")) {
    return fail("INVALID_EMAIL", "Informe um e-mail valido");
  }

  const user = await users.findByEmail(email);
  if (user?.id === input.actorId) {
    return fail("SELF_INVITE", "Voce ja faz parte deste espaco");
  }

  if (user) {
    const existing = await workspaces.findMember(input.workspaceId, user.id);
    if (existing) {
      return fail("ALREADY_MEMBER", "Essa pessoa ja esta no espaco");
    }
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const invite = await workspaces.createInvite({
    workspaceId: input.workspaceId,
    email,
    role: input.role,
    invitedById: input.actorId,
    expiresAt,
  });

  return ok({
    invite,
    userName: user?.name ?? email.split("@")[0] ?? "pessoa",
    hasAccount: Boolean(user),
  });
}

export async function acceptWorkspaceInvite(
  inviteId: string,
  actorId: string,
  actorEmail: string,
  workspaces: WorkspaceRepository,
): Promise<Result<{ workspaceId: string }>> {
  const invite = await workspaces.findInviteById(inviteId);
  if (!invite) {
    return fail("NOT_FOUND", "Convite nao encontrado");
  }

  if (normalizeEmail(invite.email) !== normalizeEmail(actorEmail)) {
    return fail("FORBIDDEN", "Este convite nao e para a sua conta");
  }

  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    await workspaces.deleteInvite(inviteId);
    return fail("EXPIRED", "Este convite expirou. Peca um novo.");
  }

  const already = await workspaces.findMember(invite.workspaceId, actorId);
  if (already) {
    await workspaces.deleteInvite(inviteId);
    return ok({ workspaceId: invite.workspaceId });
  }

  await workspaces.addMember(invite.workspaceId, actorId, invite.role);
  await workspaces.deleteInvite(inviteId);
  return ok({ workspaceId: invite.workspaceId });
}

export async function declineWorkspaceInvite(
  inviteId: string,
  actorEmail: string,
  workspaces: WorkspaceRepository,
): Promise<Result<{ ok: true }>> {
  const invite = await workspaces.findInviteById(inviteId);
  if (!invite) {
    return fail("NOT_FOUND", "Convite nao encontrado");
  }

  if (normalizeEmail(invite.email) !== normalizeEmail(actorEmail)) {
    return fail("FORBIDDEN", "Este convite nao e para a sua conta");
  }

  await workspaces.deleteInvite(inviteId);
  return ok({ ok: true });
}
