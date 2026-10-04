import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceSummary,
  WorkspaceType,
} from "./workspace";
import type { WorkspaceInsights } from "./workspace-insights";

export interface CreateWorkspaceInput {
  name: string;
  type: WorkspaceType;
  ownerId: string;
}

export interface WorkspaceRepository {
  create(input: CreateWorkspaceInput): Promise<Workspace>;
  findById(id: string): Promise<Workspace | null>;
  listByUser(userId: string): Promise<WorkspaceSummary[]>;
  findMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null>;
  listMembers(workspaceId: string): Promise<WorkspaceMember[]>;
  addMember(workspaceId: string, userId: string, role: WorkspaceRole): Promise<void>;
  updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<void>;
  removeMember(workspaceId: string, userId: string): Promise<void>;
  rename(workspaceId: string, name: string): Promise<void>;
  archive(workspaceId: string): Promise<void>;
  unarchive(workspaceId: string): Promise<void>;
  moveToTrash(workspaceId: string): Promise<void>;
  restoreFromTrash(workspaceId: string): Promise<void>;
  deleteById(workspaceId: string): Promise<void>;
  deleteByIds(ids: string[]): Promise<void>;
  getInsights(workspaceId: string): Promise<WorkspaceInsights | null>;
}
