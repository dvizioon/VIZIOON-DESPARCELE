import type { SystemRole } from "@/modules/auth/domain/user";
import type {
  PlatformOverview,
  PlatformUser,
  PlatformWorkspace,
  SignupFields,
  SmtpSummary,
  SystemSettings,
} from "./platform";

export interface AdminRepository {
  overview(): Promise<PlatformOverview>;
  smtpSummary(): Promise<SmtpSummary>;
  getSystemSettings(): Promise<SystemSettings>;
  setAllowPublicSignup(enabled: boolean): Promise<SystemSettings>;
  setSignupFields(fields: SignupFields): Promise<SystemSettings>;
  listUsers(): Promise<PlatformUser[]>;
  findUser(id: string): Promise<PlatformUser | null>;
  countActiveAdmins(): Promise<number>;
  setUserDisabled(userId: string, disabledAt: Date | null): Promise<void>;
  setUserRole(userId: string, role: SystemRole): Promise<void>;
  setUserPassword(userId: string, passwordHash: string): Promise<void>;
  listWorkspaces(): Promise<PlatformWorkspace[]>;
}
