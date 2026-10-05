export type WorkspaceType = "PERSONAL" | "SHARED";
export type WorkspaceRole = "ADMIN" | "EDITOR" | "VIEWER";

export type WorkspaceListView = "todos" | "arquivados" | "lixeira";

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  archivedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: WorkspaceRole;
  invitedById: string;
  invitedByName: string;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface WorkspaceSummary extends Workspace {
  role: WorkspaceRole;
  memberCount: number;
}

function hasTimestamp(value: Date | null | undefined): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function isTrashed(workspace: Pick<Workspace, "deletedAt">): boolean {
  return hasTimestamp(workspace.deletedAt);
}

export function isArchived(workspace: Pick<Workspace, "archivedAt" | "deletedAt">): boolean {
  return hasTimestamp(workspace.archivedAt) && !hasTimestamp(workspace.deletedAt);
}

export function workspaceListBucket(
  workspace: Pick<Workspace, "archivedAt" | "deletedAt">,
): WorkspaceListView {
  if (isTrashed(workspace)) {
    return "lixeira";
  }

  if (isArchived(workspace)) {
    return "arquivados";
  }

  return "todos";
}

export function parseWorkspaceListView(value: string | undefined): WorkspaceListView {
  if (value === "arquivados" || value === "lixeira") {
    return value;
  }

  return "todos";
}

export function isAdmin(member: Pick<WorkspaceMember, "role">): boolean {
  return member.role === "ADMIN";
}

export function canEditContent(member: Pick<WorkspaceMember, "role">): boolean {
  return member.role === "ADMIN" || member.role === "EDITOR";
}

export function roleLabel(role: WorkspaceRole): string {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "EDITOR":
      return "Editor";
    case "VIEWER":
      return "Visualizador";
  }
}

export function parseWorkspaceRole(value: string): WorkspaceRole | null {
  if (value === "ADMIN" || value === "EDITOR" || value === "VIEWER") {
    return value;
  }

  return null;
}
