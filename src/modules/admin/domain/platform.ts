import type { SystemRole } from "@/modules/auth/domain/user";
import type { WorkspaceType } from "@/modules/workspace/domain/workspace";

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  systemRole: SystemRole;
  disabledAt: Date | null;
  createdAt: Date;
  ownedWorkspaceCount: number;
};

export type PlatformWorkspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  memberCount: number;
  debtCount: number;
  archivedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
};

export type PlatformOverview = {
  users: {
    total: number;
    active: number;
    disabled: number;
    admins: number;
  };
  workspaces: {
    total: number;
    active: number;
    archived: number;
    trash: number;
    personal: number;
    shared: number;
  };
  debts: {
    total: number;
  };
  mail: {
    providers: number;
    pending: number;
    failed: number;
    sent: number;
  };
};

export type SmtpSummary = {
  count: number;
  defaultName: string | null;
  defaultHost: string | null;
};

export type SignupFields = {
  name: boolean;
  email: boolean;
  phone: boolean;
  password: boolean;
};

export type SystemSettings = {
  allowPublicSignup: boolean;
  signupFields: SignupFields;
  brandLogoUrl: string | null;
  brandFaviconUrl: string | null;
  updatedAt: Date | null;
};

export const DEFAULT_SIGNUP_FIELDS: SignupFields = {
  name: true,
  email: true,
  phone: false,
  password: true,
};
