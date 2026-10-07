import { prisma } from "@/shared/infrastructure/prisma";
import type { CreateUserInput, UpdateProfileInput, UserRepository } from "../domain/user-repository";
import { isSeedMasterAdmin, parseAvatarVariant, type User } from "../domain/user";

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? mapUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? mapUser(row) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const row = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        phone: input.phone ?? null,
        systemRole: input.systemRole ?? "MEMBER",
        emailVerifiedAt: input.emailVerified ? new Date() : null,
      },
    });
    return mapUser(row);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
    const row = await prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        phone: input.phone,
      },
    });
    return mapUser(row);
  }

  async updateAvatarUrl(userId: string, avatarUrl: string | null): Promise<User> {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return mapUser(row);
  }

  async updateAvatarVariant(userId: string, variant: string): Promise<User> {
    const row = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarVariant: parseAvatarVariant(variant),
        avatarUrl: null,
      },
    });
    return mapUser(row);
  }

  async markEmailVerified(userId: string): Promise<User> {
    const row = await prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
    return mapUser(row);
  }

  async closeAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { disabledAt: new Date() },
    });
  }

  async replacePasswordReset(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findPasswordReset(
    tokenHash: string,
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!row) {
      return null;
    }

    return { userId: row.userId, expiresAt: row.expiresAt };
  }

  async deletePasswordResets(userId: string): Promise<void> {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
  }

  async replaceEmailVerification(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await prisma.emailVerificationToken.deleteMany({ where: { userId } });
    await prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findEmailVerification(
    tokenHash: string,
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    const row = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    if (!row) {
      return null;
    }

    return { userId: row.userId, expiresAt: row.expiresAt };
  }

  async deleteEmailVerifications(userId: string): Promise<void> {
    await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  }
}

function mapUser(row: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  avatarUrl: string | null;
  avatarVariant: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  systemRole: "MEMBER" | "ADMIN";
  disabledAt: Date | null;
}): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    phone: row.phone,
    avatarUrl: row.avatarUrl,
    avatarVariant: parseAvatarVariant(row.avatarVariant),
    emailVerifiedAt: row.emailVerifiedAt,
    createdAt: row.createdAt,
    systemRole: isSeedMasterAdmin(row.email) ? "ADMIN" : row.systemRole,
    disabledAt: row.disabledAt,
  };
}
