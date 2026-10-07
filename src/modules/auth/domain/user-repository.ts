import type { SystemRole, User } from "./user";

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  systemRole?: SystemRole;
  /** Se true, marca como verificado na criação (ex.: admin). */
  emailVerified?: boolean;
}

export interface UpdateProfileInput {
  name: string;
  phone: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  updateProfile(userId: string, input: UpdateProfileInput): Promise<User>;
  updateAvatarUrl(userId: string, avatarUrl: string | null): Promise<User>;
  updateAvatarVariant(userId: string, variant: string): Promise<User>;
  markEmailVerified(userId: string): Promise<User>;
  closeAccount(userId: string): Promise<void>;
  replacePasswordReset(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findPasswordReset(
    tokenHash: string,
  ): Promise<{ userId: string; expiresAt: Date } | null>;
  deletePasswordResets(userId: string): Promise<void>;
  replaceEmailVerification(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findEmailVerification(
    tokenHash: string,
  ): Promise<{ userId: string; expiresAt: Date } | null>;
  deleteEmailVerifications(userId: string): Promise<void>;
}
