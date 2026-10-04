import type { User } from "./user";

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  replacePasswordReset(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findPasswordReset(
    tokenHash: string,
  ): Promise<{ userId: string; expiresAt: Date } | null>;
  deletePasswordResets(userId: string): Promise<void>;
}
