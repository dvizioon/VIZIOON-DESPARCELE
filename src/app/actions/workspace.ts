"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { changeMemberRole } from "@/modules/workspace/application/change-member-role";
import { createWorkspace } from "@/modules/workspace/application/create-workspace";
import {
  archiveWorkspace,
  unarchiveWorkspace,
} from "@/modules/workspace/application/archive-workspace";
import {
  permanentlyDeleteWorkspaces,
  restoreWorkspace,
  trashWorkspace,
} from "@/modules/workspace/application/delete-workspace";
import { inviteMember } from "@/modules/workspace/application/invite-member";
import { removeMember } from "@/modules/workspace/application/remove-member";
import { renameWorkspace } from "@/modules/workspace/application/rename-workspace";
import { dispatchMail } from "@/modules/mail/application/dispatch-mail";
import { formatMailDate, getAppOrigin } from "@/shared/config/app-origin";
import { isAdmin, parseWorkspaceRole, roleLabel, type WorkspaceType } from "@/modules/workspace/domain/workspace";
import type { WorkspaceInsights } from "@/modules/workspace/domain/workspace-insights";
import { requireUser } from "@/shared/auth/session";
import { getRepositories } from "@/shared/infrastructure/container";
import type { ActionState } from "./auth";

export async function createWorkspaceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { workspaces } = getRepositories();
  const typeValue = String(formData.get("type") ?? "PERSONAL");
  const type: WorkspaceType = typeValue === "SHARED" ? "SHARED" : "PERSONAL";

  const result = await createWorkspace(
    {
      name: String(formData.get("name") ?? ""),
      type,
      ownerId: user.id,
    },
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect(`/w/${result.value.id}`);
}

export async function inviteMemberAction(
  workspaceId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { workspaces, users } = getRepositories();

  const role = parseWorkspaceRole(String(formData.get("role") ?? "EDITOR"));
  if (!role) {
    return { error: "Papel invalido" };
  }

  const result = await inviteMember(
    {
      workspaceId,
      actorId: user.id,
      email: String(formData.get("email") ?? ""),
      role,
    },
    workspaces,
    users,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  const workspace = await workspaces.findById(workspaceId);
  const invitedEmail = String(formData.get("email") ?? "");
  void dispatchMail(
    "workspace_invite",
    invitedEmail,
    {
      nome: result.value.name,
      email: invitedEmail,
      workspace: workspace?.name ?? "Espaco",
      convidadoPor: user.name,
      papel: roleLabel(role),
      data: formatMailDate(),
      link: `${await getAppOrigin()}/w/${workspaceId}`,
    },
    getRepositories().mail,
  ).catch(() => undefined);

  revalidatePath(`/w/${workspaceId}`);
  revalidatePath(`/w/${workspaceId}/membros`);
  return { error: null };
}

export async function changeMemberRoleAction(
  workspaceId: string,
  targetUserId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const role = parseWorkspaceRole(String(formData.get("role") ?? ""));
  if (!role) {
    return { error: "Papel invalido" };
  }

  const { workspaces } = getRepositories();
  const result = await changeMemberRole(workspaceId, user.id, targetUserId, role, workspaces);

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath(`/w/${workspaceId}`);
  revalidatePath(`/w/${workspaceId}/membros`);
  return { error: null };
}

export async function removeMemberAction(
  workspaceId: string,
  targetUserId: string,
): Promise<ActionState> {
  const user = await requireUser();
  const { workspaces } = getRepositories();
  const result = await removeMember(workspaceId, user.id, targetUserId, workspaces);

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/workspaces");
  revalidatePath(`/w/${workspaceId}`);
  revalidatePath(`/w/${workspaceId}/membros`);
  return { error: null };
}

export async function renameWorkspaceAction(
  workspaceId: string,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const { workspaces } = getRepositories();
  const result = await renameWorkspace(
    workspaceId,
    user.id,
    String(formData.get("name") ?? ""),
    workspaces,
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/workspaces");
  revalidatePath(`/w/${workspaceId}`);
  revalidatePath(`/w/${workspaceId}/membros`);
  return { error: null };
}

export async function archiveWorkspaceAction(workspaceId: string): Promise<ActionState> {
  const user = await requireUser();
  const { workspaces } = getRepositories();
  const result = await archiveWorkspace(workspaceId, user.id, workspaces);

  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect("/workspaces?view=arquivados");
}

export async function unarchiveWorkspaceAction(workspaceId: string): Promise<ActionState> {
  const user = await requireUser();
  const { workspaces } = getRepositories();
  const result = await unarchiveWorkspace(workspaceId, user.id, workspaces);

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/workspaces");
  revalidatePath(`/w/${workspaceId}`);
  revalidatePath(`/w/${workspaceId}/membros`);
  return { error: null };
}

export async function trashWorkspaceAction(workspaceId: string): Promise<ActionState> {
  const user = await requireUser();
  const { workspaces } = getRepositories();
  const result = await trashWorkspace(workspaceId, user.id, workspaces);

  if (!result.ok) {
    return { error: result.error.message };
  }

  redirect("/workspaces?view=lixeira");
}

export async function restoreWorkspaceAction(workspaceId: string): Promise<ActionState> {
  const user = await requireUser();
  const { workspaces } = getRepositories();
  const result = await restoreWorkspace(workspaceId, user.id, workspaces);

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/workspaces");
  revalidatePath(`/w/${workspaceId}`);
  revalidatePath(`/w/${workspaceId}/membros`);
  return { error: null };
}

export async function permanentlyDeleteWorkspacesAction(
  workspaceIds: string[],
): Promise<ActionState> {
  const user = await requireUser();
  const { workspaces } = getRepositories();
  const result = await permanentlyDeleteWorkspaces(workspaceIds, user.id, workspaces);

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/workspaces");
  return { error: null };
}

export async function getWorkspaceInsightsAction(
  workspaceId: string,
): Promise<{ ok: true; insights: WorkspaceInsights } | { ok: false; error: string }> {
  const user = await requireUser();
  const { workspaces } = getRepositories();
  const member = await workspaces.findMember(workspaceId, user.id);

  if (!member || !isAdmin(member)) {
    return { ok: false, error: "Sem acesso aos ajustes" };
  }

  const insights = await workspaces.getInsights(workspaceId);
  if (!insights) {
    return { ok: false, error: "Espaco nao encontrado" };
  }

  return { ok: true, insights };
}
